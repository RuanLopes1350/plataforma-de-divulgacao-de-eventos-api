// src/services/EventoService.js

import EventoRepository from "../repositories/EventoRepository.js";
import UsuarioRepository from "../repositories/UsuarioRepository.js";
import objectIdSchema from "../utils/validators/schemas/zod/ObjectIdSchema.js";
import { EventoQuerySchema } from "../utils/validators/schemas/zod/querys/EventoQuerySchema.js";
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from "../utils/helpers/index.js";

class EventoService {
    constructor() {
        this.repository = new EventoRepository();
        this.usuarioRepository = new UsuarioRepository();
    }

    // POST /eventos
    async cadastrar(dadosEventos) {
        const data = await this.repository.cadastrar(dadosEventos);
        return data;
    }
    
    // GET /eventos && GET /eventos/:id
    async listar(req, usuarioId, opcoes = {}) {
        if(typeof req === 'string') {
            objectIdSchema.parse(req);
            
            const eventoReq = { params: { id: req } };
            const evento = await this.repository.listar(eventoReq);
            
            // Para usuários não autenticados, só mostrar eventos ativos
            if (!usuarioId && evento.status !== 'ativo') {
                throw new CustomError({
                    statusCode: HttpStatusCodes.NOT_FOUND.code,
                    errorType: 'resourceNotFound',
                    field: 'Evento',
                    details: [],
                    customMessage: 'Evento não encontrado ou inativo.'
                });
            }
            
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
        
        const data = await this.repository.alterar(id, parsedData);
        return data;
    }
    
    // PATCH /eventos/:id/status
    async alterarStatus(id, novoStatus, usuarioId) {
        const evento = await this.ensureEventExists(id);
        
        await this.ensureUserIsOwner(evento, usuarioId, true);
        
        if (novoStatus === 'ativo') {
            await this.validarMidiasObrigatorias(evento);
        }
        
        const statusAtualizado = await this.repository.alterarStatus(id, novoStatus);
        return statusAtualizado;
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

        // Verificar se já tem permissão ativa
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

    /**
     * Garante que o evento existe.
     */
    async ensureEventExists(id) {
        objectIdSchema.parse(id);
        const evento = await this.repository.listarPorId(id);
        
        if(!evento) {
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
     * @param {Object} evento - O evento a ser verificado
     * @param {String} usuarioId - ID do usuário a verificar
     * @param {Boolean} ownerOnly - Se true, apenas o proprietário original é permitido
     */
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

    /**
     * Valida se o evento tem todas as mídias obrigatórias antes de ativar
     */
    async validarMidiasObrigatorias(evento) {
        const midiaErrors = [];
        
        if (!evento.midiaVideo || evento.midiaVideo.length === 0) {
            midiaErrors.push('Vídeo é obrigatório');
        }
        
        if (!evento.midiaCapa || evento.midiaCapa.length === 0) {
            midiaErrors.push('Capa é obrigatória');
        }
        
        if (!evento.midiaCarrossel || evento.midiaCarrossel.length === 0) {
            midiaErrors.push('Carrossel é obrigatório');
        }
        
        if (midiaErrors.length > 0) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'midias',
                details: midiaErrors,
                customMessage: `Não é possível ativar o evento. Não possui mídias obrigatórias: ${midiaErrors.join(', ')}`
            });
        }
    }

}

export default EventoService;