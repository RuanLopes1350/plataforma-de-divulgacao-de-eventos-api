// src/controllers/EventoController.js

import { z } from 'zod';
import EventoService from '../services/EventoService.js';
import { EventoSchema, EventoUpdateSchema } from '../utils/validators/schemas/zod/EventoSchema.js';
import { EventoQuerySchema } from '../utils/validators/schemas/zod/querys/EventoQuerySchema.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
import CompartilharPermissaoSchema from '../utils/validators/schemas/zod/CompartilharPermissaoSchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes,
    errorHandler,
    messages,
    StatusService,
    asyncWrapper
} from '../utils/helpers/index.js';


class EventoController {
    constructor() {
        this.service = new EventoService();
    }

    // POST /eventos
    async cadastrar(req, res) {
        const usuarioLogado = req.user;

        const dadosEvento = {
            ...req.body,
            organizador: {
                _id: usuarioLogado._id,
                nome: usuarioLogado.nome
            }
        };

        // Validação dos dados do evento (sem mídias)
        const parseData = EventoSchema.parse(dadosEvento);
        
        // Cadastra o evento
        const data = await this.service.cadastrar(parseData);
        
        return CommonResponse.created(res, data);
    }
    
    // GET /eventos && GET /eventos/:id
    async listar(req, res) {
        console.log("Estou no listar em EventoController");

        const { id } = req.params || {};
        if (id) {
            objectIdSchema.parse(id);
        }

        const query = req.query || {};
        if (Object.keys(query).length !== 0) {
            await EventoQuerySchema.parseAsync(query);
        }

        const data = await this.service.listar(req);
        return CommonResponse.success(res, data);
    }

    async gerarQRCode(req, res) {
        const { id } = req.params;
        objectIdSchema.parse(id);

        const qrResult = await this.service.gerarQRCodeEvento(id, req.user?._id);
        return CommonResponse.success(res, qrResult, 200, 'QR Code gerado com sucesso.');
    }


    // PATCH /eventos/:id
    async alterar(req, res) {
        const { id } = req.params;
        const usuarioLogado = req.user;
        
        objectIdSchema.parse(id);
        
        const parseData = EventoUpdateSchema.parse(req.body);
        
        const data = await this.service.alterar(id, parseData, usuarioLogado._id);
        
        return CommonResponse.success(res, data);
    }

    // PATCH /eventos/:id/compartilhar
    async compartilharPermissao(req, res) {
        const { id } = req.params;
        const usuarioLogado = req.user;
        
        objectIdSchema.parse(id);
        
        // Validação de entrada (formato) com Zod
        const { email, permissao, expiraEm } = await CompartilharPermissaoSchema.parseAsync(req.body);

        const data = await this.service.compartilharPermissao(id, email, permissao, expiraEm, usuarioLogado._id);
        
        return CommonResponse.success(res, data, 200, 'Permissão compartilhada com sucesso!');
    }

    // DELETE /eventos/:id
    async deletar(req, res) {
        const { id } = req.params;
        const usuarioLogado = req.user;
        
        objectIdSchema.parse(id);
        
        const data = await this.service.deletar(id, usuarioLogado._id);
        
        return CommonResponse.success(res, { message: messages.validation.generic.resourceDeleted('Evento'), data });
    }
}

export default EventoController;