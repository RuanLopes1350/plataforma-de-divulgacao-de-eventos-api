//models/Usuario.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

class Usuario {
    constructor() {
        const usuarioSchema = new mongoose.Schema(
            {
                nome: { type: String, index: true, required: true },
                email: { type: String, unique: true, index: true, required: true },
                senha: { type: String, required: true, select: false },
                status: { type: String, enum: ['ativo', 'inativo'], default: 'ativo' },
                tokenUnico: { type: String, select: false }, // Token único para validação de email, recuperação de senha e autenticação
                exp_tokenUnico_recuperacao: { type: Date, select: false }, // Data de expiração do token de recuperação de senha, usado para validar a recuperação de senha do usuário
                refreshtoken: { type: String, select: false }, // Refresh token para geração de access token de autenticação longa duração 7 dias para invalidação
                accesstoken: { type: String, select: false }, // Refresh token para  autenticação curta longa 15 minutos para invalidação
            },
            {
                timestamps: true,
                versionKey: false,
            }
        );

        usuarioSchema.plugin(mongoosePaginate);

        this.model = mongoose.model('usuarios', usuarioSchema);
    }
}

export default new Usuario().model;