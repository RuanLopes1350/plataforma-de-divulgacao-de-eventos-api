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

    comDescricao(descricao) {
        if (descricao) {
            this.filtros.descricao = { $regex: this.escapeRegex(descricao), $options: 'i' };
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
            const tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
            if (tagsArray.length > 0) {
                this.filtros.tags = { $in: tagsArray };
            }
        }
        return this;
    }

    comStatus(status) {
        if (status) {
            if (Array.isArray(status)) {
                // Se for um array, filtra apenas os valores e cria uma consulta válida
                const statusValidos = status.filter(s => ['ativo', 'inativo'].includes(s));
                if (statusValidos.length > 0) {
                    this.filtros.status = { $in: statusValidos };
                }
            } else if (['ativo', 'inativo'].includes(status)) {
                // Se for uma string única, mantém o comportamento original
                this.filtros.status = status;
            }
        }
        return this;
    }

    comTipo(tipo) {
        if (tipo) {
            const dataAtual = new Date();
            
            switch (tipo) {
                case 'historico':
                    this.filtros.dataEvento = { $lt: dataAtual };
                    if (!this.filtros.status) {
                        this.filtros.status = 'ativo';
                    }
                    break;
                    
                case 'ativo':
                    const inicioDia = startOfDay(dataAtual);
                    const fimDia = endOfDay(dataAtual);
                    this.filtros.dataEvento = { 
                        $gte: inicioDia,
                        $lte: fimDia
                    };
                    if (!this.filtros.status) {
                        this.filtros.status = 'ativo';
                    }
                    break;
                    
                case 'futuro':
                    this.filtros.dataEvento = { $gt: dataAtual };
                    if (!this.filtros.status) {
                        this.filtros.status = 'ativo';
                    }
                    break;
            }
        }
        return this;
    }

    comIntervaloData(dataInicio, dataFim) {
        if (!this.filtros.dataEvento) {
            this.filtros.dataEvento = {};
        }
        
        if (dataInicio) {
            this.filtros.dataEvento.$gte = new Date(dataInicio);
        }
        
        if (dataFim) {
            this.filtros.dataEvento.$lte = new Date(dataFim);
        }
        
        if (!dataInicio && !dataFim && Object.keys(this.filtros.dataEvento).length === 0) {
            delete this.filtros.dataEvento;
        }
        
        return this;
    }

    async comOrganizadorNome(nomeOrganizador) {
        if (nomeOrganizador) {
            const usuarios = await this.usuarioModel.find({
                nome: { $regex: new RegExp(nomeOrganizador, 'i') }
            });

            const usuarioIds = usuarios.map(usuario => usuario._id);
            
            if (usuarioIds.length > 0) {
                this.filtros['organizador._id'] = { $in: usuarioIds };
            }
        }
        return this;
    }

    comOrganizador(organizadorId) {
        if (organizadorId && mongoose.Types.ObjectId.isValid(organizadorId)) {
            this.filtros['organizador._id'] = new mongoose.Types.ObjectId(organizadorId);
        }
        return this;
    }

    comPermissao(usuarioId) {
        if (usuarioId && mongoose.Types.ObjectId.isValid(usuarioId)) {
            const dataAtual = new Date();
            
            if (!this.filtros.$or) {
                this.filtros.$or = [];
            }
            
            this.filtros.$or.push(
                // Eventos próprios (organizador)
                { 'organizador._id': new mongoose.Types.ObjectId(usuarioId) },
                // Eventos com permissão compartilhada
                {
                    permissoes: {
                        $elemMatch: {
                            usuario: new mongoose.Types.ObjectId(usuarioId),
                            permissao: 'editar',
                            expiraEm: { $gt: dataAtual }
                        }
                    }
                }
            );
        }
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
