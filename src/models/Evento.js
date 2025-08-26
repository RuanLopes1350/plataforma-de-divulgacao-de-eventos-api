//models/Eventos.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import Usuario from './Usuario.js';

const permissaoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuarios',
        required: true,
    },
    permissao: {
        type: String,
        enum: ['editar'],
        default: 'editar',
    },
    expiraEm: { 
        type: Date, 
        required: true 
    }
}, { _id: false });

class Evento {
    constructor() {
        const eventoSchema = new mongoose.Schema(
            {
                titulo: { type: String, index: true, required: true },
                descricao: { type: String, required: true },
                local: { type: String, required: true },
                dataEvento: { type: Date, required: true },
                organizador: {
                    _id: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'usuarios',
                        required: true,
                    },
                    nome: {
                        type: String,
                        required: true,
                    },
                },
                linkInscricao: { type: String, required: true},
                eventoCriadoEm: { type: Date, default: Date.now, required: true },
                tags: { type: [ String ], required: true, validate: { validator: (arr) => arr.length > 0, message: 'tags não pode ser vazio' }},
                categoria: { type: String, required: true },
                status: { type: String, enum: ['ativo', 'inativo'], default: 'inativo' },
                midiaVideo: {
                    type: [{
                        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
                        url: { type: String, required: true },
                        tamanhoMb: {type: Number, required: true },
                        altura: { type: Number, required: true },
                        largura: { type: Number, required: true },
                    }],
                    default: [],
                    validate: { validator: function(arr) { return this.status === 'inativo' || arr.length > 0 }, message: 'midiaVideo é obrigatório para eventos ativos' },
                },
                midiaCapa: {
                    type: [{
                        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
                        url: { type: String, required: true },
                        tamanhoMb: { type: Number, required: true },
                        altura: { type: Number, required: true },
                        largura: { type: Number, required: true },
                    }],
                    default: [],
                    validate: { validator: function(arr) { return this.status === 'inativo' || arr.length > 0 }, message: 'midiaCapa é obrigatório para eventos ativos' },
                },
                midiaCarrossel: {
                    type: [{
                        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
                        url: { type: String, required: true },
                        tamanhoMb: { type: Number, required: true },
                        altura: { type: Number, required: true },
                        largura: { type: Number, required: true },
                    }],
                    default: [],
                    validate: { validator: function(arr) { return this.status === 'inativo' || arr.length > 0 }, message: 'midiaCarrossel é obrigatório para eventos ativos' },
                },
                permissoes: [permissaoSchema],
            },
            {
                timestamps: { createdAt: 'eventoCriadoEm' },
                versionKey: false,
            }
        );

        eventoSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('eventos', eventoSchema);
    }
}

export default new Evento().model;