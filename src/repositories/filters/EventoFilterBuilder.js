// src/repositories/filters/EventoFilterBuilder.js

import mongoose from 'mongoose';
import { startOfDay, endOfDay } from 'date-fns';
import EventoModel from '../../models/Evento.js';
import UsuarioModel from '../../models/Usuario.js';
import EventoRepository from '../EventoRepository.js';
import UsuarioRepository from '../UsuarioRepository.js';

class EventoFilterBuilder {
    constructor() {
        this.filtros = {};
        this.eventoRepository = new EventoRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.eventoModel = EventoModel;
        this.usuarioModel = UsuarioModel;
    }

    comTitulo(titulo) {
        if (titulo) {
            this.filtros.titulo = { $regex: this.escapeRegex(titulo), $options: 'i' };
        }
        return this;
    }

    comLocal(local) {
        if (local) {
            this.filtros.local = { $regex: this.escapeRegex(local), $options: 'i' };
        }
        return this;
    }

    comCategoria(categoria) {
        if (categoria) {
            this.filtros.categoria = { $regex: this.escapeRegex(categoria), $options: 'i' };
        }
        return this;
    }

    comTags(tags) {
        if (tags) {
            if (Array.isArray(tags)) {
                // Se vier como array (do QuerySchema), busca cada tag individualmente
                if (tags.length > 0) {
                    this.filtros.tags = { $in: tags };
                }
            } else {
                // Se vier como string, busca usando regex (busca parcial dentro das tags)
                this.filtros.tags = { $regex: this.escapeRegex(tags), $options: 'i' };
            }
        }
        return this;
    }

    comPermissao(usuarioId) {
        if (!usuarioId) return this;

        // Inclui eventos cujo organizador é o usuário OU que contenham uma permissão válida para o usuário
        try {
            const userObjectId = mongoose.Types.ObjectId.isValid(usuarioId) ? mongoose.Types.ObjectId(usuarioId) : usuarioId;
            const agora = new Date();
            this.filtros.$or = [
                { 'organizador._id': userObjectId },
                { permissoes: { $elemMatch: { usuario: userObjectId, expiraEm: { $gt: agora } } } }
            ];
        } catch (e) {
            // em caso de id inválido, ignora a parte do ObjectId e tenta usar valor cru
            this.filtros.$or = [
                { 'organizador._id': usuarioId },
                { permissoes: { $elemMatch: { usuario: usuarioId, expiraEm: { $gt: new Date() } } } }
            ];
        }

        return this;
    }

    comStatus(status) {
        if (status !== undefined && status !== null) {
            if (Array.isArray(status)) {
                // Se for um array, filtra apenas os valores válidos (0 ou 1)
                const statusValidos = status.filter(s => s === 0 || s === 1 || s === '0' || s === '1')
                    .map(s => parseInt(s)); // Converte para número
                if (statusValidos.length > 0) {
                    this.filtros.status = { $in: statusValidos };
                }
            } else {
                // Se for um valor único, valida se é 0 ou 1
                const statusNum = parseInt(status);
                if (statusNum === 0 || statusNum === 1) {
                    this.filtros.status = statusNum;
                }
            }
        }
        return this;
    }

    comIntervaloData(dataInicio, dataFim) {
        if (dataInicio || dataFim) {
            // Filtra eventos que se sobrepõem ao intervalo especificado
            const filtroData = {};

            if (dataInicio && dataFim) {
                // Eventos que começam antes do fim do período E terminam depois do início do período
                filtroData.$and = [
                    { dataInicio: { $lte: new Date(dataFim) } },
                    { dataFim: { $gte: new Date(dataInicio) } }
                ];
            } else if (dataInicio) {
                // Eventos que terminam depois da data de início especificada
                filtroData.dataFim = { $gte: new Date(dataInicio) };
            } else if (dataFim) {
                // Eventos que começam antes da data de fim especificada
                filtroData.dataInicio = { $lte: new Date(dataFim) };
            }

            // Merge os filtros de data com os filtros existentes
            Object.assign(this.filtros, filtroData);
        }

        return this;
    }

    comExibicaoTotem(dataAtual, diaAtual, periodoAtual) {
        // Dentro do período de exibição
        this.filtros.exibInicio = { $lte: dataAtual };
        this.filtros.exibFim = { $gte: dataAtual };

        // Dia da semana permitido
        this.filtros.exibDia = { $regex: diaAtual, $options: 'i' };

        // Período do dia permitido
        const campoPeriodo = `exib${periodoAtual.charAt(0).toUpperCase() + periodoAtual.slice(1)}`;
        this.filtros[campoPeriodo] = true;

        return this;
    }

    comMidiaObrigatoria() {
        this.filtros['midia.0'] = { $exists: true };
        return this;
    }

    escapeRegex(texto) {
        return texto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    build() {
        return this.filtros;
    }
}

export default EventoFilterBuilder;
