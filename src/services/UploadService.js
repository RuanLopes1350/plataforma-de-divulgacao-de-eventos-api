// src/services/UploadService.js

import mongoose from "mongoose";
import UploadRepository from "../repositories/UploadRepository.js";
import EventoService from "./EventoService.js";
import objectIdSchema from "../utils/validators/schemas/zod/ObjectIdSchema.js";
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from '../utils/helpers/index.js';
import sharp from "sharp";
import fs from "fs";
import path from "path";
import logger from "../utils/logger.js";

const midiasDimensoes = {
    carrossel: { altura: 720, largura: 1280 },
    capa: { altura: 720, largura: 1280 },
    video: { altura: 720, largura: 1280 }
};

class UploadService {
    constructor() {
        this.repository = new UploadRepository();
        this.eventoService = new EventoService();
    }

    // POST /eventos/:id/midia/:tipo
    async adicionarMidia(eventoId, tipo, file, usuarioId) {
        objectIdSchema.parse(eventoId);
    
        const evento = await this.eventoService.ensureEventExists(eventoId);
        await this.eventoService.ensureUserIsOwner(evento, usuarioId, false);
        
        const filePath = path.resolve(`uploads/${tipo}/${file.filename}`);
        
        let midia;
        
        if (tipo === 'video') {
            // Para vídeos, não é usado Sharp pois é usado somente para validar imagens
            const { altura, largura } = midiasDimensoes[tipo];
            midia = {
                _id: new mongoose.Types.ObjectId(),
                url: `/uploads/${tipo}/${file.filename}`,
                tamanhoMb: +(file.size / (1024 * 1024)).toFixed(2),
                altura,
                largura,
            };
        } else {
            // Para imagens, é usado para obter os metadados e validar as dimensões
            const metadata = await sharp(filePath).metadata();
            const { altura: alturaEsperada, largura: larguraEsperada } = midiasDimensoes[tipo];

            if(metadata.height !== alturaEsperada || metadata.width !== larguraEsperada) {
                this.removerArquivo(filePath);
                
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'dimensoes',
                    customMessage: `Dimensões inválidas. Esperado: ${larguraEsperada}x${alturaEsperada}px, recebido: ${metadata.width}x${metadata.height}px.`
                });
            }

            midia = {
                _id: new mongoose.Types.ObjectId(),
                url: `/uploads/${tipo}/${file.filename}`,
                tamanhoMb: +(file.size / (1024 * 1024)).toFixed(2),
                altura: metadata.height,
                largura: metadata.width,
            };
        }

        return await this.repository.adicionarMidia(eventoId, tipo, midia);
    }

    // POST /eventos/:id/midia/carrossel
    async adicionarMultiplasMidias(eventoId, tipo, files, usuarioId) {
        objectIdSchema.parse(eventoId);
    
        const evento = await this.eventoService.ensureEventExists(eventoId);
        await this.eventoService.ensureUserIsOwner(evento, usuarioId, false);
        
        const midiasProcessadas = [];
        const { altura: alturaEsperada, largura: larguraEsperada } = midiasDimensoes[tipo];

        for (const file of files) {
            const filePath = path.resolve(`uploads/${tipo}/${file.filename}`);
            
            const metadata = await sharp(filePath).metadata();

            if(metadata.height !== alturaEsperada || metadata.width !== larguraEsperada) {
                // Limpa todos os arquivos já processados em caso de erro
                files.forEach(f => {
                    this.removerArquivo(path.resolve(`uploads/${tipo}/${f.filename}`));
                });
                
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'dimensoes',
                    customMessage: `Dimensões inválidas no arquivo "${file.originalname}". Esperado: ${larguraEsperada}x${alturaEsperada}px, recebido: ${metadata.width}x${metadata.height}px.`
                });
            }

            const midia = {
                _id: new mongoose.Types.ObjectId(),
                url: `/uploads/${tipo}/${file.filename}`,
                tamanhoMb: +(file.size / (1024 * 1024)).toFixed(2),
                altura: metadata.height,
                largura: metadata.width,
            };
            
            midiasProcessadas.push(midia);
        }

        return await this.repository.adicionarMultiplasMidias(eventoId, tipo, midiasProcessadas);
    }

    // GET /eventos/:id/midias
    async listarTodasMidias(eventoId) {
        objectIdSchema.parse(eventoId);

        const evento = await this.repository.listarTodasMidias(eventoId);

        return {
            capa: evento.midiaCapa,
            carrossel: evento.midiaCarrossel,
            video: evento.midiaVideo
        };
    }

    // GET /eventos/:id/midia/capa
    async listarMidiaCapa(eventoId) {
        objectIdSchema.parse(eventoId);

        const evento = await this.repository.listarMidiaCapa(eventoId);

        return { midiaCapa: evento.midiaCapa };
    }

    // GET /eventos/:id/midia/video
    async listarMidiaVideo(eventoId) {
        objectIdSchema.parse(eventoId);

        const evento = await this.repository.listarMidiaVideo(eventoId);

        return { midiaVideo: evento.midiaVideo };
    }
    
    // GET /eventos/:id/midia/carrossel
    async listarMidiaCarrossel(eventoId) {
        objectIdSchema.parse(eventoId);

        const evento = await this.repository.listarMidiaCarrossel(eventoId);

        return { midiaCarrossel: evento.midiaCarrossel };
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
                const filePath = arquivo.path;
                let midia;
                
                if (tipo === 'midiaVideo') {
                    const { altura, largura } = midiasDimensoes.video;
                    midia = {
                        url: `/uploads/video/${arquivo.filename}`,
                        tamanhoMb: +(arquivo.size / (1024 * 1024)).toFixed(2),
                        altura,
                        largura
                    };
                } else {
                    const metadata = await sharp(filePath).metadata().catch(() => {
                        // Limpar todos os arquivos em caso de erro ao ler metadados
                        this.limparArquivosProcessados(files);
                        throw new CustomError({
                            statusCode: HttpStatusCodes.BAD_REQUEST.code,
                            errorType: 'validationError',
                            field: 'arquivo',
                            customMessage: `Arquivo "${arquivo.originalname}" está corrompido ou não é uma imagem válida.`
                        });
                    });

                    const tipoParaValidacao = tipo.replace('midia', '').toLowerCase();
                    const { altura: alturaEsperada, largura: larguraEsperada } = midiasDimensoes[tipoParaValidacao];

                    if (metadata.height !== alturaEsperada || metadata.width !== larguraEsperada) {
                        // Limpar todos os arquivos em caso de erro ao validar dimensões
                        this.limparArquivosProcessados(files);
                        
                        throw new CustomError({
                            statusCode: HttpStatusCodes.BAD_REQUEST.code,
                            errorType: 'validationError',
                            field: 'dimensoes',
                            customMessage: `Dimensões inválidas para ${tipo}. Esperado: ${larguraEsperada}x${alturaEsperada}px, recebido: ${metadata.width}x${metadata.height}px.`
                        });
                    }

                    midia = {
                        url: `/uploads/${tipoParaValidacao}/${arquivo.filename}`,
                        tamanhoMb: +(arquivo.size / (1024 * 1024)).toFixed(2),
                        altura: metadata.height,
                        largura: metadata.width
                    };
                }
                
                midiasProcessadas[tipo].push(midia);
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
        return fs.existsSync(caminhoCompleto) && 
               fs.rmSync(caminhoCompleto, { force: true, recursive: false }) === undefined;
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
}

export default UploadService;