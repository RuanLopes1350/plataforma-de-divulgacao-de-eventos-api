// src/controllers/EventoController.js

import { z } from 'zod';
import EventoService from '../services/EventoService.js';
import { EventoSchema, EventoUpdateSchema } from '../utils/validators/schemas/zod/EventoSchema.js';
import { EventoQuerySchema } from '../utils/validators/schemas/zod/querys/EventoQuerySchema.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
import {
    CommonResponse,
    CustomError,
    HttpStatusCodes,
    errorHandler,
    messages,
    StatusService,
    asyncWrapper
} from '../utils/helpers/index.js';
import QRCode from 'qrcode';


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
        
        const { email, permissao = 'editar', expiraEm } = req.body;

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