// src/repositories/UploadRepository.js

import EventoModel from "../models/Evento.js";
import MidiaFilterBuilder from "./filters/MidiaFilterBuilder.js";
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from '../utils/helpers/index.js';

class UploadRepository { 
    constructor({
        eventoModel = EventoModel,
    } = {}) {
        this.model = eventoModel;
    }



    // Método para garantir que evento existe
    async _ensureEventExists(eventoId) {
        const evento = await this.model.findById(eventoId);

        if(!evento) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'Evento',
                customMessage: messages.error.resourceNotFound('Evento')
            });
        }

        return evento;
    }

    // POST /eventos/:id/midia/:tipo
    async adicionarMidia(eventoId, tipo, midia) {
        const tipos = {
            capa: 'midiaCapa',
            carrossel: 'midiaCarrossel',
            video: 'midiaVideo',
        };

        const tipoCampo = tipos[tipo];

        if(!tipoCampo) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'invalidField',
                field: 'tipo',
                customMessage: `Tipo de mídia '${tipo}' não é permitido.`
            });
        }

        const evento = await this._ensureEventExists(eventoId);

        evento[tipoCampo].push(midia);
        await evento.save();

        return midia;
    }

    // POST /eventos/:id/midia/carrossel
    async adicionarMultiplasMidias(eventoId, tipo, midias) {
        const tipos = {
            capa: 'midiaCapa',
            carrossel: 'midiaCarrossel',
            video: 'midiaVideo',
        };

        const tipoCampo = tipos[tipo];

        if(!tipoCampo) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'invalidField',
                field: 'tipo',
                customMessage: `Tipo de mídia '${tipo}' não é permitido.`
            });
        }

        const evento = await this._ensureEventExists(eventoId);

        const eventoAtualizado = await this.model.findByIdAndUpdate(
            eventoId,
            { 
                $push: { 
                    [tipoCampo]: { $each: midias } 
                } 
            },
            { new: true }
        );

        if(!eventoAtualizado) {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                errorType: 'databaseError',
                field: 'Evento',
                customMessage: 'Erro ao adicionar mídias ao evento.'
            });
        }

        return eventoAtualizado;
    }

    // GET /eventos/:id/midias com suporte a filtros
    async listar(req) {
        const eventoId = req.params.id;
        
        if (!eventoId) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'eventoId',
                customMessage: 'ID do evento é obrigatório.'
            });
        }

        const evento = await this._ensureEventExists(eventoId);
        
        const { tipo } = req.query;

        const filterBuilder = new MidiaFilterBuilder()
            .comTipo(tipo);

        if (typeof filterBuilder.build !== 'function') {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                errorType: 'internalServerError',
                field: 'MidiaFilterBuilder',
                customMessage: 'Erro interno no sistema de filtros de mídia.'
            });
        }

        const filtros = filterBuilder.build();
        
        // Aplica os filtros construídos pelo FilterBuilder
        return filterBuilder.aplicar(evento);
    }





    //DELETE /eventos/:id/midia/:tipo/:id
    async deletarMidia(eventoId, tipo, midiaId) {
        const tipos = {
            capa: 'midiaCapa',
            carrossel: 'midiaCarrossel',
            video: 'midiaVideo',
        };

        const tipoCampo = tipos[tipo];

        if(!tipoCampo) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'invalidField',  
                field: 'tipo',
                customMessage: `Tipo de mídia '${tipo}' não é permitido.` 
            });
        }

        const evento = await this._ensureEventExists(eventoId);

        const midias = evento[tipoCampo];
        const midiaIndex = midias.findIndex(m => m._id.toString() === midiaId);

        if(midiaIndex === -1) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'Mídia',
                customMessage: messages.error.resourceNotFound('Mídia')
            });
        }

        const midiaRemovida = midias[midiaIndex];

        midias.splice(midiaIndex, 1);
        await evento.save();

        return midiaRemovida;
    }
}

export default UploadRepository;