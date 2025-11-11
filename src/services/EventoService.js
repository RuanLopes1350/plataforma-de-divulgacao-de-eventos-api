// src/services/EventoService.js

import EventoRepository from "../repositories/EventoRepository.js";
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import objectIdSchema from "../utils/validators/schemas/zod/ObjectIdSchema.js";
import { emailCompartilhamentoDono, emailCompartilhamento } from "../utils/templates/emailTemplates.js";
import { EventoQuerySchema } from "../utils/validators/schemas/zod/querys/EventoQuerySchema.js";
import { CustomError, HttpStatusCodes, messages } from "../utils/helpers/index.js";
import QRCode from 'qrcode';
import { enviarEmail } from '../utils/mailClient.js';

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
        return data;
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
    async alterar(id, parsedData, usuario) {
        const evento = await this.ensureEventExists(id);

        await this.ensureUserIsOwner(evento, usuario, false);

        // Se houver tags novas no parsedData, normalize e una com as tags existentes
        if (parsedData.tags) {
            const incoming = this.normalizeTags(parsedData.tags);
            const existing = Array.isArray(evento.tags) ? evento.tags : this.normalizeTags(evento.tags || '');
            parsedData.tags = this.mergeTags(existing, incoming);
        }

        const data = await this.repository.alterar(id, parsedData);
        return data;
    }

    // PATCH /eventos/:id/organizador
    async alterarOrganizador(id, novoOrganizadorId, usuario) {
        const evento = await this.ensureEventExists(id);

        await this.ensureUserIsOwner(evento, usuario, false);

        const usuarioDestino = await this.usuarioRepository.listarPorId(novoOrganizadorId);

        const filtro = { _id: id };
        const update = {
            $set: {
                organizador: {
                    _id: usuarioDestino._id,
                    nome: usuarioDestino.nome,
                }
            }
        };

        const data = await this.repository.model.updateOne(filtro, update);
        return data;
    }

    // PATCH /eventos/:id/compartilhar
    async compartilharPermissao(eventoId, email, usuario) {
        const evento = await this.ensureEventExists(eventoId);
        const usuarioId = usuario._id;

        await this.ensureUserIsOwner(evento, usuario, true);

        const usuarioDestino = await this.usuarioRepository.buscarPorEmail(email);
        const usuarioDono = usuario;

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
            p.usuario.toString() === usuarioDestino._id.toString()
        );

        if (permissaoExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.CONFLICT.code,
                errorType: 'duplicateResource',
                field: 'permissao',
                details: [],
                customMessage: `Usuário ${email} já possui permissão para este evento.`
            });
        }

        // Adicionar permissão com valores padrão
        const permissao = 'editar';
        const expiraEm = null; // Sem data de expiração (tempo indeterminado)

        const filtro = { _id: eventoId };
        const update = {
            $push: {
                permissoes: {
                    usuario: usuarioDestino._id,
                    nome: usuarioDestino.nome,
                    email: usuarioDestino.email,
                    permissao,
                    expiraEm
                }
            }
        };

        await this.repository.model.updateOne(filtro, update);

        const emailDataDestino = {
            email: usuarioDestino.email,
            nome: usuarioDestino.nome,
            nomeDono: usuarioDono.nome,
            evento: evento.titulo
        };

        const emailDataDono = {
            email: usuarioDono.email,
            nome: usuarioDestino.nome,
            nomeDono: usuarioDono.nome,
            evento: evento.titulo
        };

        await enviarEmail(emailCompartilhamentoDono(emailDataDono));
        await enviarEmail(emailCompartilhamento(emailDataDestino));

        const eventoAtualizado = await this.repository.listarPorId(eventoId);
        return eventoAtualizado;
    }

    // DELETE /eventos/:id/compartilhar/:usuarioId
    async removerCompartilhamento(eventoId, usuarioIdRemover, usuarioLogado) {
        const evento = await this.ensureEventExists(eventoId);

        // Apenas o proprietário pode remover compartilhamentos
        await this.ensureUserIsOwner(evento, usuarioLogado, true);

        const permissaoExistente = evento.permissoes?.find(p =>
            p.usuario.toString() === usuarioIdRemover
        );

        if (!permissaoExistente) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'permissao',
                details: [],
                customMessage: 'Permissão não encontrada para este usuário.'
            });
        }

        // Remover permissão
        const filtro = { _id: eventoId };
        const update = {
            $pull: {
                permissoes: { usuario: usuarioIdRemover }
            }
        };

        await this.repository.model.updateOne(filtro, update);

        const eventoAtualizado = await this.repository.listarPorId(eventoId);
        return eventoAtualizado;
    }

    // DELETE /eventos/:id
    async deletar(id, usuario) {
        const evento = await this.ensureEventExists(id);

        await this.ensureUserIsOwner(evento, usuario, true);

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

    /**
     * Garante que o usuário autenticado é o dono do evento ou possui permissão compartilhada válida.
     */
    async ensureUserIsOwner(evento, usuario, ownerOnly = false) {
        const usuarioId = usuario._id;
        const usuarioObj = usuario;

        // Se for admin (quando temos o objeto do usuário), permite sempre
        if (usuarioObj && usuarioObj.admin === true) {
            return;
        }

        // Se for o organizador do evento
        if (usuarioId && evento.organizador && evento.organizador._id && evento.organizador._id.toString() === usuarioId.toString()) {
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
        const permissaoValida = (evento.permissoes || []).some(permissao => {
            const usuarioCorreto = usuarioId && permissao.usuario.toString() === usuarioId.toString();
            const permissaoEditar = permissao.permissao === 'editar';
            const naoExpirou = !permissao.expiraEm || new Date(permissao.expiraEm) > agora;

            return usuarioCorreto && permissaoEditar && naoExpirou;
        });

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

    async generateQRCodeImage(link) {
        try {
            const dataUrl = await QRCode.toDataURL(link);
            const buffer = await QRCode.toBuffer(link);
            return { dataUrl, buffer };
        } catch (error) {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                errorType: 'internalServerError',
                field: 'QRCode',
                details: [],
                customMessage: 'Erro ao gerar código QR.'
            });
        }
    }

    // Lista eventos para exibição no totem
    async listarParaTotem() {
        const dataAtual = new Date();

        // Determina o dia da semana (0-6, sendo 0 domingo)
        const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const diaAtual = diasSemana[dataAtual.getDay()];

        // Determina o período do dia baseado no horário atual
        const horaAtual = dataAtual.getHours();
        let periodoAtual;
        if (horaAtual >= 6 && horaAtual < 12) {
            periodoAtual = 'manha';
        } else if (horaAtual >= 12 && horaAtual < 18) {
            periodoAtual = 'tarde';
        } else {
            periodoAtual = 'noite';
        }

        return await this.repository.listarParaTotem(dataAtual, diaAtual, periodoAtual);
    }

    // Lista TODOS os eventos do sistema (apenas admin)
    async listarTodosEventos(req) {
        return await this.repository.listarTodosEventos(req);
    }
}

export default EventoService;