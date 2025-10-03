// src/services/EventoService.js

import EventoRepository from "../repositories/EventoRepository.js";
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import objectIdSchema from "../utils/validators/schemas/zod/ObjectIdSchema.js";
import { EventoQuerySchema } from "../utils/validators/schemas/zod/querys/EventoQuerySchema.js";
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from "../utils/helpers/index.js";
import QRCode from 'qrcode';

class EventoService {
    constructor() {
        this.repository = new EventoRepository();
        this.usuarioRepository = new UsuarioRepository();
    }

    // POST /eventos
    async cadastrar(dadosEvento) {
        if (dadosEvento.tags) {
            dadosEvento.tags = this.normalizeTags(dadosEvento.tags);
        }

        const data = await this.repository.cadastrar(dadosEvento);
        return data
    }

    // GET /eventos && GET /eventos/:id
    async listar(req, usuarioId, opcoes = {}) {
        if (typeof req === 'string') {
            objectIdSchema.parse(req);

            const eventoReq = { params: { id: req } };
            const evento = await this.repository.listar(eventoReq);

            return evento;
        }

        if (!req.query) req.query = {};
        if (!req.user && usuarioId) req.user = { _id: usuarioId };

        // Validar query parameters se existirem
        if (Object.keys(req.query).length > 0) {
            EventoQuerySchema.parse(req.query);
        }

        if (opcoes.apenasVisiveis && usuarioId) {
            // Aqui em "Apenas visíveis" retorna eventos do usuário e eventos com permissão compartilhada
            // Permite visualizar eventos de qualquer status (ativo, inativo)
            // Ignora o filtro padrão que limita requisições não autenticadas a ver apenas eventos ativos (totem)
            req.user = { _id: usuarioId };
            req.query.ignorarFiltroStatusPadrao = true;
        }

        return await this.repository.listar(req);
    }

    // PATCH /eventos/:id
    async alterar(id, parsedData, usuarioId) {
        const evento = await this.ensureEventExists(id);

        await this.ensureUserIsOwner(evento, usuarioId, false);
        // Se houver tags novas no parsedData, normalize e una com as tags existentes
        if (parsedData.tags) {
            const incoming = this.normalizeTags(parsedData.tags);
            const existing = Array.isArray(evento.tags) ? evento.tags : this.normalizeTags(evento.tags || '');
            parsedData.tags = this.mergeTags(existing, incoming);
        }

        const data = await this.repository.alterar(id, parsedData);
        return data;
    }

    // PATCH /eventos/:id/compartilhar
    async compartilharPermissao(eventoId, email, permissao, expiraEm, usuarioId) {
        const evento = await this.ensureEventExists(eventoId);

        await this.ensureUserIsOwner(evento, usuarioId, true);

        const usuarioDestino = await this.usuarioRepository.buscarPorEmail(email);

        if (!usuarioDestino) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Usuario',
                details: [],
                customMessage: `Usuário com email ${email} não encontrado.`
            });
        }

        if (usuarioDestino._id.toString() === usuarioId) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'email',
                details: [],
                customMessage: 'Você não pode compartilhar o evento consigo mesmo.'
            });
        }

        const permissaoExistente = evento.permissoes?.find(p =>
            p.usuario.toString() === usuarioDestino._id.toString() &&
            new Date(p.expiraEm) > new Date()
        );

        if (permissaoExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.CONFLICT.code,
                errorType: 'duplicateResource',
                field: 'permissao',
                details: [],
                customMessage: `Usuário ${email} já possui permissão ativa para este evento.`
            });
        }

        // Adicionar ou atualizar permissão
        const filtro = { _id: eventoId };
        const update = {
            $push: {
                permissoes: {
                    usuario: usuarioDestino._id,
                    permissao,
                    expiraEm
                }
            }
        };

        await this.repository.model.updateOne(filtro, update);

        return await this.repository.listarPorId(eventoId);
    }

    // DELETE /eventos/:id
    async deletar(id, usuarioId) {
        const evento = await this.ensureEventExists(id);

        await this.ensureUserIsOwner(evento, usuarioId, true);

        const { default: UploadService } = await import('./UploadService.js');
        new UploadService().limparMidiasDoEvento(evento);

        const data = await this.repository.deletar(id);
        return data;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // MÉTODOS AUXILIARES
    ////////////////////////////////////////////////////////////////////////////////

    async gerarQRCodeEvento(id, usuarioId) {
        objectIdSchema.parse(id);

        const evento = await this.listar(id, usuarioId);

        if (!evento) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Evento',
                details: [],
                customMessage: messages.event.notFound
            });
        }

        const link = evento.link;
        if (!link) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'link',
                details: [],
                customMessage: 'Link externo não encontrado para este evento.'
            });
        }

        const qr = await this.generateQRCodeImage(link);
        return { eventoId: evento._id, link, qrcode: qr?.dataUrl ?? null, buffer: qr?.buffer ?? null };
    }

    normalizeTags(raw) {
        if (!raw && raw !== 0) return [];

        if (Array.isArray(raw)) {
            return raw
                .filter(Boolean)
                .map(t => String(t).trim())
                .filter(t => t.length > 0)
                .reduce((acc, t) => (acc.includes(t) ? acc : acc.concat(t)), []);
        }

        if (typeof raw !== 'string') {
            raw = String(raw);
        }

        raw = raw.trim();
        if (raw.length === 0) return [];

        const parts = raw.split(',').map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length === 0) return [];

        return parts.reduce((acc, t) => (acc.includes(t) ? acc : acc.concat(t)), []);
    }

    mergeTags(existing = [], incoming = []) {
        const result = Array.isArray(existing) ? existing.slice() : [];
        for (const t of incoming) {
            const tag = String(t).trim();
            if (!tag) continue;
            if (!result.includes(tag)) result.push(tag);
        }
        return result;
    }


    /**
     * Garante que o evento existe.
     */
    async ensureEventExists(id) {
        objectIdSchema.parse(id);
        const evento = await this.repository.listarPorId(id);

        if (!evento) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Evento',
                details: [],
                customMessage: messages.error.resourceNotFound('Evento'),
            });
        }
        return evento;
    }


    // Garante que o usuário autenticado é o dono do evento ou possui permissão compartilhada válida.
    async ensureUserIsOwner(evento, usuarioId, ownerOnly = false) {
        // Se for o dono, permite sempre as requisições
        if (evento.organizador._id.toString() === usuarioId) {
            return;
        }

        // Se o modo estrito estiver ativado, apenas o dono é permitido
        if (ownerOnly) {
            throw new CustomError({
                statusCode: 403,
                errorType: 'unauthorizedAccess',
                field: 'Evento',
                details: [],
                customMessage: 'Apenas o proprietário do evento pode realizar esta operação.'
            });
        }

        // Verificação de permissão compartilhada com o usuário
        const agora = new Date();
        const permissaoValida = (evento.permissoes || []).some(permissao =>
            permissao.usuario.toString() === usuarioId &&
            permissao.permissao === 'editar' &&
            new Date(permissao.expiraEm) > agora
        );

        if (permissaoValida) {
            return;
        }

        // Caso contrário, bloqueia o acesso do usuário
        throw new CustomError({
            statusCode: 403,
            errorType: 'unauthorizedAccess',
            field: 'Evento',
            details: [],
            customMessage: 'Você não tem permissão para manipular este evento.'
        });
    }

    // Busca eventos que devem ser exibidos no totem no momento atual
    async listarParaTotem() {
        const agora = new Date();

        // Determinar dia da semana atual (0=domingo, 1=segunda, etc.)
        const diaSemana = agora.getDay();
        const diasSemanaMap = {
            0: 'domingo',
            1: 'segunda',
            2: 'terca',
            3: 'quarta',
            4: 'quinta',
            5: 'sexta',
            6: 'sabado'
        };
        const diaAtual = diasSemanaMap[diaSemana];

        // Determinar período do dia atual
        const horaAtual = agora.getHours();
        let periodoAtual = '';
        if (horaAtual >= 6 && horaAtual < 12) {
            periodoAtual = 'manha';
        } else if (horaAtual >= 12 && horaAtual < 18) {
            periodoAtual = 'tarde';
        } else {
            periodoAtual = 'noite';
        }

        return await this.repository.listarParaTotem(agora, diaAtual, periodoAtual);
    }
}

export default EventoService;