// src/repositories/EventoRepository.js

import UsuarioModel from '../models/Usuario.js';
import EventoModel from '../models/Evento.js';
import EventoFilterBuilder from './filters/EventoFilterBuilder.js';
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from '../utils/helpers/index.js';
import mongoose from 'mongoose';

class EventoRepository {
    constructor({
        eventoModel = EventoModel,
        usuarioModel = UsuarioModel
    } = {}) {
        this.model = eventoModel;
        this.usuarioModel = usuarioModel;
    }

    // POST /eventos
    async cadastrar(dadosEventos) {
        return await this.model.create(dadosEventos);
    }

    // GET /eventos com suporte a filtros e paginação'
    async listar(req) {
        const id = req.params.id || null;

        if (id) {
            const data = await this.model.findById(id);

            if (!data) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.NOT_FOUND.code,
                    errorType: 'resourceNotFound',
                    field: 'Evento',
                    details: [],
                    customMessage: messages.error.resourceNotFound('Evento')
                });
            }

            return data;
        }

        const {
            titulo,
            descricao,
            local,
            categoria,
            tags,
            tipo,
            dataInicio,
            dataFim,
            page = 1,
            limite = 10,
            organizadorId,
            ignorarFiltroStatusPadrao = false,
            ordenarPor
        } = req.query;

        // Normalizar tags: aceitar tanto string CSV quanto array
        let tagsToFilter = tags;
        if (typeof tags === 'string' && tags.includes(',')) {
            tagsToFilter = tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        // Tratamento para o status que pode ser string ou array de string
        const status = Array.isArray(req.query.status) ? req.query.status : req.query.status;

        const itemsPorPagina = Math.min(parseInt(limite, 10) || 10, 100);

        const filterBuilder = new EventoFilterBuilder()
            .comTitulo(titulo)
            .comLocal(local)
            .comCategoria(categoria)
            .comStatus(status)
            .comTags(tagsToFilter)
            .comOrdenacao(ordenarPor);

        const usuarioId = req.user?._id || organizadorId;

        // Aplicar filtros de permissão se usuário estiver autenticado
        if (usuarioId) {
            filterBuilder.comPermissao(usuarioId);
        } else if (this.aplicarFiltroStatusAtivo(ignorarFiltroStatusPadrao, status, usuarioId)) {
            // Para usuários não autenticados só mostra eventos ativos (1)
            filterBuilder.comStatus(1);
        }

        if (tipo) {
            // Tipo é um campo simples no modelo; aplicar como filtro direto
            filterBuilder.filtros.tipo = tipo;
        } else {
            filterBuilder.comIntervaloData(dataInicio, dataFim);
        }

        if (typeof filterBuilder.build !== 'function') {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                errorType: 'internalServerError',
                field: 'Evento',
                details: [],
                customMessage: messages.error.internalServerError('Evento')
            });
        }

        const filtros = filterBuilder.build();
        const sortConfig = filterBuilder.getOrdenacao();

        const options = {
            page: parseInt(page),
            limit: parseInt(itemsPorPagina),
            sort: sortConfig,
            lean: false
        };

        const resultado = await this.model.paginate(filtros, options);

        return resultado;
    }

    // GET /eventos/:id
    async listarPorId(id) {
        const data = await this.model.findById(id);

        if (!data) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Evento',
                details: [],
                customMessage: messages.error.resourceNotFound('Evento')
            });
        }
        return data;
    }

    // PATCH /eventos/:id
    async alterar(id, dadosAtualizados) {
        const data = await this.model.findByIdAndUpdate(id, dadosAtualizados, { new: true });

        if (!data) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Evento',
                details: [],
                customMessage: messages.error.resourceNotFound('Evento')
            });
        }
        return data;
    }

    // PATCH /eventos/:id/status
    async alterarStatus(id, novoStatus) {
        const evento = await this.model.findByIdAndUpdate(id, { status: novoStatus }, { new: true });

        if (!evento) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Evento',
                details: [],
                customMessage: messages.error.resourceNotFound('Evento')
            });
        }
        return evento;
    }

    // DELETE /eventos/:id
    async deletar(id) {
        const data = await this.model.findByIdAndDelete(id);

        if (!data) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Evento',
                details: [],
                customMessage: messages.error.resourceNotFound('Evento')
            });
        }
        return data;
    }

    // Determina se deve aplicar filtro de status automático baseado no contexto do usuário
    aplicarFiltroStatusAtivo(ignorarFiltroStatusPadrao, status, usuarioId) {
        // Se usuário autenticado, não aplica filtro automático
        if (usuarioId) return false;

        // Se status foi passado como filtro, aplica o filtro
        if (status) return false;

        // Se pediu para ignorar, não aplica
        if (ignorarFiltroStatusPadrao) return false;

        // Para requisições não autenticadas e sem filtragem específica retorna tudo
        return true;
    }

    // Lista eventos que devem ser exibidos no totem agora
    async listarParaTotem(dataAtual, diaAtual, periodoAtual) {
        const inicioDodia = new Date(dataAtual);
        inicioDodia.setHours(0, 0, 0, 0);

        const fimDoDia = new Date(dataAtual);
        fimDoDia.setHours(23, 59, 59, 999);

        const filtros = {
            // Apenas eventos ativos
            status: 1,

            // Dentro do período de exibição
            exibInicio: { $lte: dataAtual },
            exibFim: { $gte: dataAtual },

            // Dia da semana permitido
            exibDia: { $regex: diaAtual, $options: 'i' },

            // Período do dia permitido
            [`exib${periodoAtual.charAt(0).toUpperCase() + periodoAtual.slice(1)}`]: true,

            // Deve ter pelo menos uma mídia
            'midia.0': { $exists: true }
        };

        // Retorna apenas campos necessários para o totem
        const projection = {
            titulo: 1,
            descricao: 1,
            local: 1,
            dataInicio: 1,
            dataFim: 1,
            midia: 1,
            cor: 1,
            animacao: 1,
            categoria: 1,
            tags: 1,
            link: 1
        };

        return await this.model.find(filtros, projection).sort({ dataInicio: 1 });
    }
}

export default EventoRepository;