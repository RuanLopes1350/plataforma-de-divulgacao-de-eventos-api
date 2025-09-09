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
        const { tipo } = req.query;

        const filtros = {};
        if (tipo) {
            filtros.tipo = tipo;
        }

        const midias = await this.service.listarTodasMidias(eventoId, filtros);

        const mensagem = tipo 
            ? `Mídias do tipo '${tipo}' retornadas com sucesso.`
            : `Mídias do evento retornadas com sucesso.`;

        return CommonResponse.success(res, midias, 200, mensagem);
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