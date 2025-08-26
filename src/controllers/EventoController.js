// src/controllers/EventoController.js

import { z } from 'zod';
import EventoService from '../services/EventoService.js';
import UploadService from '../services/UploadService.js';
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
        this.uploadService = new UploadService();
    }

    // POST /eventos
    async cadastrar(req, res) {
        // Pega o usuário autenticado
        const usuarioLogado = req.user;
        const files = req.files || {};

        let dadosEvento = {
            ...req.body,
            organizador: {
                _id: usuarioLogado._id,
                nome: usuarioLogado.nome
            }
        };

        // PREPROCESSAMENTO: Converte tags de string para array em multipart/form-data
        if (dadosEvento.tags && typeof dadosEvento.tags === 'string') {
            try {
                // Tenta fazer parse como JSON primeiro (formato: ["tag1", "tag2"])
                dadosEvento.tags = JSON.parse(dadosEvento.tags);
            } catch (error) {
                // Se falhar, trata como CSV (formato: "tag1,tag2,tag3")
                dadosEvento.tags = dadosEvento.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
        }

        const dadosParaValidacaoPrevia = {
            ...dadosEvento,
            midiaVideo: [],
            midiaCapa: [],
            midiaCarrossel: []
        };
        
        const validacaoPrevia = EventoSchema.safeParse(dadosParaValidacaoPrevia);
        
        if (!validacaoPrevia.success) {
            if (Object.keys(files).length > 0) {
                this.uploadService.limparArquivosProcessados(files);
            }
            
            throw validacaoPrevia.error;
        }

        if (Object.keys(files).length > 0) {
            const midiasProcessadas = await this.uploadService.processarArquivosParaCadastro(files);
            dadosEvento = { ...dadosEvento, ...midiasProcessadas };
        }

        const parseData = EventoSchema.safeParse(dadosEvento);
        if (!parseData.success) {
            if (Object.keys(files).length > 0) {
                this.uploadService.limparArquivosProcessados(files);
            }
            throw parseData.error;
        }

        const data = await this.service.cadastrar(parseData.data).catch(error => {
            if (Object.keys(files).length > 0) {
                this.uploadService.limparArquivosProcessados(files);
            }
            throw error;
        });
        
        return CommonResponse.created(res, data);
    }
    
    // GET /eventos && GET /eventos/:id
    async listar(req, res) {
        const { id } = req.params || {};
        const usuarioId = req.user?._id;
        
        if (id) {
            objectIdSchema.parse(id);
        }
        
        const query = req.query || {};
        if (Object.keys(query).length !== 0) {
            await EventoQuerySchema.parseAsync(query);
        }
        
        // Verifica se a requisição é para eventos ativos (totem)
        const opcoes = {};
        if (query.apenasVisiveis === 'true' && usuarioId) {
            opcoes.apenasVisiveis = true;
        }
        
        const data = await this.service.listar(req, usuarioId, opcoes);
        
        if (id && !data) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Evento',
                details: [],
                customMessage: messages.error.resourceNotFound('Evento')
            });
        }
        
        return CommonResponse.success(res, data);
    }

    // GET /eventos/:id/qrcode
    async gerarQRCode(req, res) {
        const { id } = req.params;
        objectIdSchema.parse(id);

        if(!id) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'id',
                details: [],
                customMessage: 'ID do evento é obrigatório para gerar o QR Code.'
            });
        }

        const evento = await this.service.listar(id, req.user?._id);
        
        if(!evento) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Evento',
                details: [],
                customMessage: messages.event.notFound
            });
        }
        
        const qrCode = await QRCode.toDataURL(evento.linkInscricao);

        return CommonResponse.success(res, { evento: evento._id, linkInscricao: evento.linkInscricao, qrcode: qrCode }, 200, 'QR Code gerado com sucesso.');
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

    // PATCH /eventos/:id/status
    async alterarStatus(req, res) {
        const { id } = req.params;
        const usuarioLogado = req.user;
        
        objectIdSchema.parse(id);
        
        const { status, validarMidias = false } = req.body;
        
        if(!status || !['ativo', 'inativo'].includes(status)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'status',
                details: [],
                customMessage: 'Status deve ser ativo ou inativo.'
            });
        }

        if (status === 'ativo' && validarMidias) {
            const evento = await this.service.ensureEventExists(id);
            await this.service.ensureUserIsOwner(evento, usuarioLogado._id, false);
            await this.service.validarMidiasObrigatorias(evento);
        }
        
        const data = await this.service.alterarStatus(id, status, usuarioLogado._id);
        
        const message = (status === 'ativo' && validarMidias) ? 'Evento cadastrado e ativado com sucesso!' : 'Status do evento alterado com sucesso!';
        
        return CommonResponse.success(res, data, 200, message);
    }

    // PATCH /eventos/:id/compartilhar
    async compartilharPermissao(req, res) {
        const { id } = req.params;
        const usuarioLogado = req.user;
        
        objectIdSchema.parse(id);
        
        const { email, permissao = 'editar', expiraEm } = req.body;
        
        // Validar email
        if (!email || !email.includes('@')) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'email',
                details: [],
                customMessage: 'Email válido é obrigatório.'
            });
        }

        // Validar data de expiração
        if (!expiraEm || new Date(expiraEm) <= new Date()) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError', 
                field: 'expiraEm',
                details: [],
                customMessage: 'Data de expiração deve ser futura.'
            });
        }

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