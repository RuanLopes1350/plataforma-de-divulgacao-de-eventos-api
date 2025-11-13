// src/services/UploadService.js
import mongoose from "mongoose";
import UploadRepository from "../repositories/UploadRepository.js";
import EventoService from "./EventoService.js";
import objectIdSchema from "../utils/validators/schemas/zod/ObjectIdSchema.js";
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes,
    errorHandler,
    messages,
    StatusService,
    asyncWrapper
} from '../utils/helpers/index.js';
import dotenv from "dotenv";
import logger from "../utils/logger.js";
import minioClient from "../config/minioConnect.js";
dotenv.config();

class UploadService {
    constructor() {
        this.repository = new UploadRepository();
        this.eventoService = new EventoService();
    }

    // POST /eventos/:id/midias (múltiplas mídias)
    async adicionarMultiplasMidias(eventoId, files, usuario) {
        console.log("Estou no adicionarMultiplasMidias em UploadService");
        objectIdSchema.parse(eventoId);

        if (!files || files.length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                customMessage: "Nenhum arquivo enviado. Por favor, inclua pelo menos um arquivo.",
            });
        }

        const evento = await this.eventoService.ensureEventExists(eventoId);
        await this.eventoService.ensureUserIsOwner(evento, usuario, false);

        const novasMidias = [];
        const resultadosUpload = [];

        // Processar cada arquivo
        for (const file of files) {
            try {
                // Fazer upload para MinIO
                const midiaInfo = await this.enviarMinio(eventoId, file);

                // Determinar tipo baseado no mimetype
                const tipo = this._determinarTipoMidia(file.mimetype);
                // Criar objeto de mídia
                const novaMidia = {
                    midiTipo: tipo,
                    midiLink: midiaInfo.url
                };

                novasMidias.push(novaMidia);
                resultadosUpload.push({
                    arquivo: file.originalname,
                    status: 'sucesso',
                    url: midiaInfo.url,
                    tipo: tipo
                });

                logger.info(`Mídia ${file.originalname} processada com sucesso`);
            } catch (error) {
                logger.error(`Erro ao processar mídia ${file.originalname}: ${error.message}`);
                resultadosUpload.push({
                    arquivo: file.originalname,
                    status: 'erro',
                    erro: error.message
                });
                // Continua processando os outros arquivos
            }
        }

        // Adicionar todas as mídias válidas ao evento
        if (novasMidias.length > 0) {
            evento.midia.push(...novasMidias);

            const resultado = await this.repository.atualizar(eventoId, {
                midia: evento.midia,
            });

            return {
                evento: resultado,
                resultados: resultadosUpload,
                totalProcessados: files.length,
                totalSucesso: novasMidias.length,
                totalErros: files.length - novasMidias.length
            };
        } else {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                customMessage: "Nenhum arquivo foi processado com sucesso.",
            });
        }
    }
    

    //DELETE /eventos/:id/midia/:tipo/:id
    async deletarMidia(eventoId, midiaId, usuario) {
        objectIdSchema.parse(eventoId);
        objectIdSchema.parse(midiaId);

        const evento = await this.eventoService.ensureEventExists(eventoId);
        await this.eventoService.ensureUserIsOwner(evento, usuario, false);

        // Encontrar a mídia específica no array
        const midiaIndex = evento.midia.findIndex(midia => midia._id.toString() === midiaId);
        
        if (midiaIndex === -1) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                customMessage: "Mídia não encontrada no evento",
            });
        }

        const midiaRemovida = evento.midia[midiaIndex];
        
        // Extrair o fileName da URL para deletar no MinIO
        const fileName = midiaRemovida.midiLink.split('/').pop();
        await this.deletarMinio(fileName);
        
        // Remover mídia do array
        evento.midia.splice(midiaIndex, 1);

        const resultado = await this.repository.atualizar(eventoId, {
            midia: evento.midia,
        });

        return resultado;
    }

    // ================================
    // MÉTODOS UTILITÁRIOS
    // ================================

    // Método para deletar todas as mídias de um evento (usado quando evento é deletado)
    async limparMidiasDoEvento(evento) {

        if (evento.midia && evento.midia.length > 0) {
            // Deletar cada mídia do MinIO
            for (const midia of evento.midia) {
                try {
                    // Extrair o fileName da URL para deletar no MinIO
                    const fileName = midia.midiLink.split('/').pop();
                    await this.deletarMinio(fileName);
                    logger.info(`Mídia ${fileName} removida do MinIO com sucesso`);
                } catch (error) {
                    logger.error(`Erro ao remover mídia ${midia.midiLink} do MinIO: ${error.message}`);
                    // Continua a execução mesmo se uma mídia falhar
                }
            }

            logger.info(`Todas as mídias do evento ${evento._id} foram removidas do MinIO`);
        } else {
            logger.info(`Evento ${evento._id} não possui mídias para remover`);
        }
    }

      // Método auxiliar para determinar tipo da mídia
    _determinarTipoMidia(mimetype) {
        if (mimetype.startsWith('image/')) {
            return 'imagem';
        } else if (mimetype.startsWith('video/')) {
            return 'video';
        }
        throw new CustomError({
            statusCode: HttpStatusCodes.BAD_REQUEST.code,
            customMessage: "Tipo de mídia não suportado.",
        });
    }

    async enviarMinio(id, file) {
        const bucket = process.env.MINIO_BUCKET_FOTOS;
        
        const targetName = `${id}-${file.originalname}`;

        const metaData = {
            "Content-Type": file.mimetype,
        };

        const uploaded = await minioClient.putObject(
            bucket,
            targetName,
            file.buffer,
            file.size,
            metaData
        );

        if (!uploaded) {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                customMessage: `Erro ao enviar arquivo: ${error.message}`,
            });
        }

        // Gerar URL pública do arquivo
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
        const publicUrl = `${protocol}://${process.env.MINIO_ENDPOINT}/${bucket}/${targetName}`;

        return {
            bucket,
            fileName: targetName,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            url: publicUrl,
        };
    }

    async deletarMinio(fileName) {
        const bucket = process.env.MINIO_BUCKET_FOTOS;

        //necessario o uso do try/catch para tratar erros de remoção
        try {
            await minioClient.removeObject(bucket, fileName);
            return true;
        } catch (error) {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                customMessage: `Erro ao remover arquivo ${fileName}: ${error.message}`,
            });
        }
    }

}

export default UploadService;
