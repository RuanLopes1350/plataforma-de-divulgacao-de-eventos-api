// src/services/UploadService.js
import mongoose from "mongoose";
import UploadRepository from "../repositories/UploadRepository.js";
import EventoService from "./EventoService.js";
import objectIdSchema from "../utils/validators/schemas/zod/ObjectIdSchema.js";
import { 
    validarArquivoPorTipo, 
    validarDimensoesPorTipo, 
    obterConfigTipo,
    DIMENSOES_POR_TIPO,
    ParametrosUploadSchema 
} from "../utils/validators/schemas/zod/UploadSchema.js";
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from '../utils/helpers/index.js';
import sharp from "sharp";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import logger from "../utils/logger.js";
dotenv.config();

class UploadService {
    constructor() {
        this.repository = new UploadRepository();
        this.eventoService = new EventoService();
    }




    // POST /eventos/:id/midia/:tipo
    async adicionarMidia(eventoId, tipo, file, usuarioId) {
        // Validações usando Zod
        objectIdSchema.parse(eventoId);
        ParametrosUploadSchema.parse({ id: eventoId, tipo });
    
        const evento = await this.eventoService.ensureEventExists(eventoId);
        await this.eventoService.ensureUserIsOwner(evento, usuarioId, false);
        
        // Validar arquivo usando schema Zod específico por tipo
        try {
            validarArquivoPorTipo(file, tipo);
        } catch (error) {
            const removido = this.removerArquivo(file.path);
            if (!removido) {
                logger.error(`Falha ao remover arquivo inválido: ${file.path}`);
            }
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'arquivo',
                customMessage: error.errors?.[0]?.message || error.message
            });
        }
        
        // Usa o caminho real do arquivo salvo pelo middleware de upload
        const filePath = file.path;
        let midia;
        
        if (tipo === 'video') {
            // Para vídeos, usa dimensões fixas (não processa com Sharp)
            const { altura, largura } = DIMENSOES_POR_TIPO[tipo];
            midia = {
                _id: new mongoose.Types.ObjectId(),
                url: `/uploads/${eventoId}/${tipo}/${file.filename}`,
                tamanhoMb: +(file.size / (1024 * 1024)).toFixed(2),
                altura,
                largura,
            };
        } else {
            // Para imagens, processa com Sharp e valida dimensões
            try {
                const metadata = await sharp(filePath).metadata();
                
                // Validar dimensões usando schema Zod
                validarDimensoesPorTipo(metadata, tipo);

                midia = {
                    _id: new mongoose.Types.ObjectId(),
                    url: `/uploads/${eventoId}/${tipo}/${file.filename}`,
                    tamanhoMb: +(file.size / (1024 * 1024)).toFixed(2),
                    altura: metadata.height,
                    largura: metadata.width,
                };
            } catch (error) {
                const removido = this.removerArquivo(filePath);
                if (!removido) {
                    logger.error(`Falha ao remover arquivo inválido: ${filePath}`);
                }
                
                // Se for erro de validação Zod, usar mensagem específica
                if (error.errors) {
                    const config = obterConfigTipo(tipo);
                    throw new CustomError({
                        statusCode: HttpStatusCodes.BAD_REQUEST.code,
                        errorType: 'validationError',
                        field: 'dimensoes',
                        customMessage: `Dimensões inválidas. Esperado: ${config.dimensoes.largura}x${config.dimensoes.altura}px, recebido: ${metadata?.width || 'N/A'}x${metadata?.height || 'N/A'}px.`
                    });
                }
                
                // Erro do Sharp ou outro
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'arquivo',
                    customMessage: `Erro ao processar arquivo de imagem: ${error.message}`
                });
            }
        }

        return await this.repository.adicionarMidia(eventoId, tipo, midia);
    }

    // POST /eventos/:id/midia/carrossel
    async adicionarMultiplasMidias(eventoId, tipo, files, usuarioId) {
        // Validações usando Zod
        objectIdSchema.parse(eventoId);
        ParametrosUploadSchema.parse({ id: eventoId, tipo });
    
        const evento = await this.eventoService.ensureEventExists(eventoId);
        await this.eventoService.ensureUserIsOwner(evento, usuarioId, false);
        
        const midiasProcessadas = [];
        const config = obterConfigTipo(tipo);

        for (const file of files) {
            try {
                // Validar arquivo usando schema Zod específico por tipo
                validarArquivoPorTipo(file, tipo);
                
                // Processar com Sharp e validar dimensões
                const filePath = file.path;
                const metadata = await sharp(filePath).metadata();
                
                // Validar dimensões usando schema Zod
                validarDimensoesPorTipo(metadata, tipo);

                const midia = {
                    _id: new mongoose.Types.ObjectId(),
                    url: `/uploads/${eventoId}/${tipo}/${file.filename}`,
                    tamanhoMb: +(file.size / (1024 * 1024)).toFixed(2),
                    altura: metadata.height,
                    largura: metadata.width,
                };
                
                midiasProcessadas.push(midia);
            } catch (error) {
                // Limpa todos os arquivos já processados em caso de erro
                files.forEach(f => {
                    this.removerArquivo(f.path);
                });
                
                // Determinar tipo de erro e mensagem apropriada
                let mensagem;
                if (error.errors) {
                    // Erro de validação Zod
                    mensagem = error.errors[0]?.message || error.message;
                    if (mensagem.includes('Altura inválida') || mensagem.includes('Largura inválida')) {
                        mensagem = `Dimensões inválidas no arquivo "${file.originalname}". Esperado: ${config.dimensoes.largura}x${config.dimensoes.altura}px.`;
                    }
                } else {
                    // Erro do Sharp ou outro
                    mensagem = `Erro ao processar arquivo "${file.originalname}": ${error.message}`;
                }
                
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: error.errors ? 'dimensoes' : 'arquivo',
                    customMessage: mensagem
                });
            }
        }

        return await this.repository.adicionarMultiplasMidias(eventoId, tipo, midiasProcessadas);
    }

    // GET /eventos/:id/midias
    async listar(req) {
        const eventoId = req.params.id;
        objectIdSchema.parse(eventoId);

        const midias = await this.repository.listar(req);
        const urlPrefix = this.getSwaggerBaseUrl() || '';
        
        const addPrefix = (midias, tipo) => Array.isArray(midias) ? midias.map(m => {
            const midia = m._doc ? m._doc : m;
            return {
                tipo,
                _id: midia._id,
                url: midia.url ? `${urlPrefix}${midia.url}` : midia.url,
                tamanhoMb: midia.tamanhoMb,
                altura: midia.altura,
                largura: midia.largura
            };
        }) : [];

        // Se há filtro por tipo específico, retorna apenas esse tipo
        const { tipo } = req.query;
        if (tipo && ['capa', 'video', 'carrossel'].includes(tipo)) {
            const tipoSelecionado = tipo;
            return addPrefix(midias[tipoSelecionado], tipoSelecionado);
        }

        // Se não há filtro, retorna todos os tipos em um array único
        return [
            ...addPrefix(midias.capa, 'capa'),
            ...addPrefix(midias.carrossel, 'carrossel'),
            ...addPrefix(midias.video, 'video')
        ];
    }





    //DELETE /eventos/:id/midia/:tipo/:id
    async deletarMidia(eventoId, tipo, midiaId, usuarioId) {
        objectIdSchema.parse(eventoId);
        objectIdSchema.parse(midiaId);

        const evento = await this.eventoService.ensureEventExists(eventoId);
        await this.eventoService.ensureUserIsOwner(evento, usuarioId, false);

        const midiaRemovida = await this.repository.deletarMidia(eventoId, tipo, midiaId);
        
        this.removerArquivo(midiaRemovida.url);

        return midiaRemovida;
    }

    /**
     * Processa arquivos para cadastro de evento
     */
    async processarArquivosParaCadastro(files) {
        const midiasProcessadas = {
            midiaVideo: [],
            midiaCapa: [],
            midiaCarrossel: []
        };

        // Processa cada tipo de mídia
        for (const [tipo, arquivos] of Object.entries(files)) {
            if (!midiasProcessadas.hasOwnProperty(tipo)) continue;

            for (const arquivo of arquivos) {
                try {
                    const tipoParaValidacao = tipo.replace('midia', '').toLowerCase();
                    
                    // Validar arquivo usando schema Zod específico por tipo
                    validarArquivoPorTipo(arquivo, tipoParaValidacao);
                    
                    const filePath = arquivo.path;
                    let midia;
                    
                    if (tipo === 'midiaVideo') {
                        const { altura, largura } = DIMENSOES_POR_TIPO.video;
                        midia = {
                            url: `/uploads/video/${arquivo.filename}`,
                            tamanhoMb: +(arquivo.size / (1024 * 1024)).toFixed(2),
                            altura,
                            largura
                        };
                    } else {
                        const metadata = await sharp(filePath).metadata().catch(() => {
                            throw new Error(`Arquivo "${arquivo.originalname}" está corrompido ou não é uma imagem válida.`);
                        });

                        // Validar dimensões usando schema Zod
                        validarDimensoesPorTipo(metadata, tipoParaValidacao);

                        midia = {
                            url: `/uploads/${tipoParaValidacao}/${arquivo.filename}`,
                            tamanhoMb: +(arquivo.size / (1024 * 1024)).toFixed(2),
                            altura: metadata.height,
                            largura: metadata.width
                        };
                    }
                    
                    midiasProcessadas[tipo].push(midia);
                } catch (error) {
                    // Limpar todos os arquivos em caso de erro
                    this.limparArquivosProcessados(files);
                    
                    // Determinar mensagem de erro apropriada
                    let mensagem;
                    if (error.errors) {
                        // Erro de validação Zod
                        mensagem = error.errors[0]?.message || error.message;
                        const tipoParaValidacao = tipo.replace('midia', '').toLowerCase();
                        const config = obterConfigTipo(tipoParaValidacao);
                        if (mensagem.includes('Altura inválida') || mensagem.includes('Largura inválida')) {
                            mensagem = `Dimensões inválidas para ${tipo}. Esperado: ${config.dimensoes.largura}x${config.dimensoes.altura}px.`;
                        }
                    } else {
                        // Erro do Sharp ou outro
                        mensagem = error.message;
                    }
                    
                    throw new CustomError({
                        statusCode: HttpStatusCodes.BAD_REQUEST.code,
                        errorType: 'validationError',
                        field: error.errors ? 'dimensoes' : 'arquivo',
                        customMessage: mensagem
                    });
                }
            }
        }

        return midiasProcessadas;
    }

    /**
     * Remove arquivo de forma única, método criado para ser reutilizado
     */
    removerArquivo(caminho) {
        let caminhoCompleto;
        
        // Se é uma URL relativa, converte para caminho absoluto
        if (caminho.startsWith('/uploads/')) {
            caminhoCompleto = path.join(process.cwd(), caminho);
        } 
        // Se é uma URL relativa, monta o caminho
        else if (caminho.startsWith('/')) {
            caminhoCompleto = path.join(process.cwd(), caminho);
        }
        else {
            caminhoCompleto = path.resolve(caminho);
        }
        
        try {
            if (fs.existsSync(caminhoCompleto)) {
                fs.rmSync(caminhoCompleto, { force: true, recursive: false });
                logger.info(`Arquivo removido com sucesso: ${caminhoCompleto}`);
                return true;
            } else {
                logger.warn(`Arquivo não encontrado para remoção: ${caminhoCompleto}`);
                return false;
            }
        } catch (error) {
            logger.error(`Erro ao remover arquivo ${caminhoCompleto}: ${error.message}`);
            return false;
        }
    }

    /**
     * Limpa todos os arquivos de um upload múltiplo em caso de erro ao cadastrar evento
     */
    limparArquivosProcessados(files) {
        for (const [tipo, arquivos] of Object.entries(files)) {
            for (const arquivo of arquivos) {
                this.removerArquivo(arquivo.path);
            }
        }
    }

    /**
     * Limpa todos os arquivos físicos de mídia de um evento após ele ser excluído do banco de dados
     */
    limparMidiasDoEvento(evento) {
        const tiposMidia = ['midiaVideo', 'midiaCapa', 'midiaCarrossel'];
        
        let arquivosRemovidos = 0;
        let totalArquivos = 0;

        tiposMidia.forEach(campo => {
            const midias = evento[campo] || [];
            
            midias.forEach(midia => {
                if (!midia.url || !midia.url.startsWith('/')) {
                    return;
                }

                totalArquivos++;
                if (this.removerArquivo(midia.url)) {
                    arquivosRemovidos++;
                }
            });
        });
    }

    getSwaggerBaseUrl() {
        const env = process.env.NODE_ENV;
        if (env === 'production') {
            return process.env.SWAGGER_PROD_URL;
        }
            return process.env.SWAGGER_DEV_URL;
    }   

}

export default UploadService;