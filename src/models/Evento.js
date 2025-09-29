//models/Eventos.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const midiaSchema = new mongoose.Schema({
    id: { 
        type: Number, 
        required: true 
    },
    midiTipo: { 
        type: String, 
        required: true 
    },
    midiLink: { 
        type: String, 
        required: true 
    }
}, { _id: false });

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
                titulo: { 
                    type: String, 
                    index: true, 
                    required: true 
                },
                descricao: { 
                    type: String, 
                    required: true 
                },
                local: { 
                    type: String, 
                    required: true 
                },
                dataInicio: { 
                    type: Date, 
                    required: true 
                },
                dataFim: { 
                    type: Date, 
                    required: true 
                },
                link: { 
                    type: String, 
                    required: true 
                },
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
                tags: { 
                    type: String, 
                    required: true 
                },
                categoria: { 
                    type: String, 
                    required: true 
                },
                cor: { 
                    type: String, 
                    required: true 
                },
                animacao: { 
                    type: String, 
                    required: true 
                },
                status: { 
                    type: Number, 
                    required: true,
                    default: 0 
                },
                midia: {
                    type: [midiaSchema],
                    default: []
                },
                permissoes: [permissaoSchema],
            },
            {
                timestamps: true,
                versionKey: false,
            }
        );

        eventoSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('eventos', eventoSchema);
    }
}

export default new Evento().model;