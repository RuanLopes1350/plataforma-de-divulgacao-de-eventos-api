//models/Eventos.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const midiaSchema = new mongoose.Schema({
    midiTipo: { 
        type: String, 
        required: true 
    },
    midiLink: { 
        type: String, 
        required: true 
    }
});

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
                exibDia: {
                    type: string,
                    required: true,
                    index: true
                },
                exibManha: {
                    type: boolean,
                    required: true,
                    index: true
                },
                exibTarde: {
                    type: boolean,
                    required: true,
                    index: true
                },
                exibNoite: {
                    type: boolean,
                    required: true,
                    index: true
                },
                exibInicio: {
                    type: Date,
                    required: true
                },
                exibFim: {
                    type: Date,
                    required: true
                },
                link: { 
                    type: String,
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
                    type: [String],
                    required: true,
                    default: []
                },
                categoria: { 
                    type: String, 
                    required: true 
                },
                cor: { 
                    type: Number, 
                    default: 0 
                },
                animacao: { 
                    type: Number, 
                    default: 0  
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