// src/controllers/UploadController.js

import UploadService from '../services/UploadService.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes,
    errorHandler,
    messages,
    StatusService,
    asyncWrapper
} from '../utils/helpers/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

class UploadController {
    constructor() {
        this.service = new UploadService();
    }

    // Função auxiliar para determinar Content-Type
    _getContentType(filename) {
        const extensao = path.extname(filename).slice(1).toLowerCase();
        const mimeTypes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            mp4: 'video/mp4',
            webm: 'video/webm',
            ogg: 'video/ogg'
        };
        return mimeTypes[extensao] || 'application/octet-stream';
    }

    // POST /eventos/:id/midia/:tipo
    async adicionarMidia(req, res) {
        const { id: eventoId, tipo } = req.params;
        const usuarioLogado = req.user;
        
        const files = req.files; // Array de arquivos (carrossel)
        const file = req.file;   // Arquivo único (capa/video)

        const hasFiles = (tipo === 'carrossel' && files && files.length > 0) || (tipo !== 'carrossel' && file);

        if (!hasFiles) {
            const campoEsperado = tipo === 'carrossel' ? 'files' : 'file';
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: campoEsperado,
                customMessage: `Arquivo(s) de mídia não enviado(s). Use o campo '${campoEsperado}' para o tipo '${tipo}'.`
            });
        }

        let resultado;

        if (tipo === 'carrossel') {
            resultado = await this.service.adicionarMultiplasMidias(eventoId, tipo, files, usuarioLogado._id);
            return CommonResponse.created(res, resultado, `${files.length} arquivo(s) de carrossel salvos com sucesso.`);
        } else {
            resultado = await this.service.adicionarMidia(eventoId, tipo, file, usuarioLogado._id);
            return CommonResponse.created(res, resultado, `Mídia (${tipo}) salva com sucesso.`);
        }
    }

    // GET /eventos/:id/midias
    async listarTodasMidias(req, res) {
        const { id: eventoId } = req.params;

        const midias = await this.service.listarTodasMidias(eventoId);

        return CommonResponse.success(res, midias, 200, `Mídias do evento retornadas com sucesso.`);
    }

    // GET /eventos/:id/midia/capa
    async listarMidiaCapa(req, res) {
        const { id: eventoId } = req.params;

        const capa = await this.service.listarMidiaCapa(eventoId);

        if (!capa.midiaCapa || capa.midiaCapa.length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'capa',
                details: [],
                customMessage: 'Capa do evento não encontrada.'
            });
        }

        const midiacapa = capa.midiaCapa[0];
        const filename = path.basename(midiacapa.url);
        const uploadsDir = path.join(currentDir, '../../uploads/capa');
        const filePath = path.join(uploadsDir, filename);

        // Verifica se o arquivo existe
        if (!fs.existsSync(filePath)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'arquivo',
                details: [],
                customMessage: 'Arquivo de capa não encontrado no servidor.'
            });
        }

        const contentType = this._getContentType(filename);
        res.setHeader('Content-Type', contentType);
        return res.sendFile(filePath);
    }

    // GET /eventos/:id/midia/video
    async listarMidiaVideo(req, res) {
        const { id: eventoId } = req.params;

        const video = await this.service.listarMidiaVideo(eventoId);

        if (!video.midiaVideo || video.midiaVideo.length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'video',
                details: [],
                customMessage: 'Vídeo do evento não encontrado.'
            });
        }

        const midiavideo = video.midiaVideo[0];
        const filename = path.basename(midiavideo.url);
        const uploadsDir = path.join(currentDir, '../../uploads/video');
        const filePath = path.join(uploadsDir, filename);

        // Verifica se o arquivo existe
        if (!fs.existsSync(filePath)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'arquivo',
                details: [],
                customMessage: 'Arquivo de vídeo não encontrado no servidor.'
            });
        }

        const contentType = this._getContentType(filename);
        res.setHeader('Content-Type', contentType);
        return res.sendFile(filePath);
    }

    // GET /eventos/:id/midia/carrossel/:index
    async listarMidiaCarrossel(req, res) {
        const { id: eventoId, index } = req.params;

        const carrossel = await this.service.listarMidiaCarrossel(eventoId);

        if (!carrossel.midiaCarrossel || carrossel.midiaCarrossel.length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'carrossel',
                details: [],
                customMessage: 'Carrossel do evento não encontrado.'
            });
        }

        // Converte index para número e valida
        const indexNum = parseInt(index) || 0;
        
        if (indexNum < 0 || indexNum >= carrossel.midiaCarrossel.length) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'index',
                details: [],
                customMessage: `Índice ${indexNum} não encontrado. O carrossel possui ${carrossel.midiaCarrossel.length} imagem(ns).`
            });
        }

        // Retorna a imagem do índice especificado
        const imagemSelecionada = carrossel.midiaCarrossel[indexNum];
        const filename = path.basename(imagemSelecionada.url);
        const uploadsDir = path.join(currentDir, '../../uploads/carrossel');
        const filePath = path.join(uploadsDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'arquivo',
                details: [],
                customMessage: 'Arquivo de carrossel não encontrado no servidor.'
            });
        }

        const contentType = this._getContentType(filename);
        res.setHeader('Content-Type', contentType);
        return res.sendFile(filePath);
    }

    //DELETE /eventos/:id/midia/:tipo/:id
    async deletarMidia(req, res) {
        const { eventoId, tipo, midiaId } = req.params;
        const usuarioLogado = req.user;

        const evento = await this.service.deletarMidia(eventoId, tipo, midiaId, usuarioLogado._id);

        return CommonResponse.success(res, evento, 200, `Midia '${tipo}' do evento deletada com sucesso.`);
    }
}

export default UploadController;