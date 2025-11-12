// src/controllers/UploadController.js

import UploadService from '../services/UploadService.js';
import { midiaUploadValidationSchema,} from '../utils/validators/schemas/zod/EventoSchema.js';
import ObjectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
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
import { da } from '@faker-js/faker';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

class UploadController {
    constructor() {
        this.service = new UploadService();
    }

    // POST /eventos/:id/midias (múltiplas mídias)
    async adicionarMultiplasMidias(req, res) {
        const eventoId = ObjectIdSchema.parse(req.params.id);
        const usuarioLogado = req.user;
        
        if (!req.files || req.files.length === 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: "validationError",
                field: "arquivos",
                customMessage: "Nenhum arquivo enviado. Por favor, inclua pelo menos um arquivo.",
            });
        }

        // Validar cada arquivo com Zod
        const validatedFiles = [];
        for (const file of req.files) {
            try {
                const validatedFile = midiaUploadValidationSchema.parse(file);
                validatedFiles.push(validatedFile);
            } catch (error) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: "validationError",
                    field: file.originalname || "arquivo",
                    customMessage: `Arquivo inválido: ${error.message}`,
                });
            }
        }

        const resultado = await this.service.adicionarMultiplasMidias(
            eventoId, 
            validatedFiles, 
            usuarioLogado
        );

        const mensagem = `${resultado.totalSucesso} de ${resultado.totalProcessados} arquivo(s) adicionado(s) com sucesso.`;
        
        return CommonResponse.success(
            res,
            resultado,
            HttpStatusCodes.OK.code,
            mensagem
        );
    }


    //DELETE /eventos/:id/midia/:tipo/:id
    async deletarMidia(req, res) {
        const { eventoId, midiaId } = req.params;
        
        const validatedEventoId = ObjectIdSchema.parse(eventoId);
        const validatedMidiaId = ObjectIdSchema.parse(midiaId);
        
        const usuarioLogado = req.user;

        const evento = await this.service.deletarMidia(validatedEventoId, validatedMidiaId, usuarioLogado._id);

        return CommonResponse.success(res, evento, 200, `Mídia '${validatedMidiaId}' deletada com sucesso.`);
    }

    // Método auxiliar para determinar o tipo da mídia
    _determinarTipoMidia(mimetype) {
        if (mimetype.startsWith('image/')) {
            return 'imagem';
        } else if (mimetype.startsWith('video/')) {
            return 'video';
        }
        throw new CustomError({
            statusCode: HttpStatusCodes.BAD_REQUEST.code,
            errorType: "validationError",
            field: "mimetype",
            customMessage: "Tipo de mídia não suportado.",
        });
    }

}

export default UploadController;