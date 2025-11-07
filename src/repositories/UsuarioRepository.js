// src/repositories/UsuarioRepository.js

import UsuarioModel from '../models/Usuario.js';
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from '../utils/helpers/index.js';

class UsuarioRepository {
    constructor({
        usuarioModel = UsuarioModel,
    } = {}) {
        this.model = usuarioModel
    }

    // POST /usuarios
    async cadastrar(dadosUsuario) {
        const usuario = new this.model(dadosUsuario);
        return await usuario.save();
    }

    // GET /usuarios
    async listar() {
        const data = await this.model.find();
        return data;
    }

    // GET /usuarios/:id
    async listarPorId(id, includeTokens = false) {
        let query = this.model.findById(id);

        if (includeTokens) {
            query = query.select('+refreshtoken +accesstoken');
        }

        const usuario = await query;

        if (!usuario) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuário')
            });
        }
        return usuario;
    }

    /**
     * Buscar usuário por email e, opcionalmente, por um ID diferente.
     */
    async buscarPorEmail(email, idIgnorado = null) {
        const filtro = { email };

        if (idIgnorado) {
            filtro._id = { $ne: idIgnorado };
        }

        const documento = await this.model.findOne(filtro, ['+senha', '+tokenUnico', '+exp_tokenUnico_recuperacao'])
        return documento;
    }

    /**
     * Busca um usuário pelo token único.
     */
    async buscarPorTokenUnico(tokenUnico) {
        const filtro = { tokenUnico };
        const documento = await this.model.findOne(filtro, ['+senha', '+tokenUnico', '+exp_tokenUnico_recuperacao']);
        return documento;
    }

    // PATCH /usuarios/:id
    async alterar(id, parsedData) {
        const usuario = await this.model.findByIdAndUpdate(id, parsedData, { new: true })

        if (!usuario) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuário')
            });
        }
        return usuario;
    }

    // Método atualizar senha do usuário
    async atualizarSenha(id, senha) {
        const usuario = await this.model.findByIdAndUpdate(
            id,
            {
                // atualiza a senha
                $set: { senha: senha },
                // remove os campos de código de recuperação e token único
                $unset: {
                    tokenUnico: "",
                    exp_tokenUnico_recuperacao: ""
                }
            },
            { new: true } // Retorna o documento atualizado
        ).exec();

        if (!usuario) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuário')
            });
        }

        return usuario;
    }

    /**
     * Armazenar accesstoken e refreshtoken no banco de dados
     */
    async armazenarTokens(id, accesstoken, refreshtoken) {
        const documento = await this.model.findByIdAndUpdate(id,
            {
                $set: { accesstoken, refreshtoken },
            },
            { new: true }
        ).select('+accesstoken +refreshtoken').exec();

        return documento;
    }

    /**
     * Atualizar usuário removendo accesstoken e refreshtoken
     */
    async removeToken(id) {
        // Criar objeto com os campos a serem atualizados
        const parsedData = {
            accesstoken: null,
            refreshtoken: null
        };
        const usuario = await this.model.findByIdAndUpdate(id, parsedData, { new: true }).exec();

        // Validar se o usuário atualizado foi retornado
        if (!usuario) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Usuário',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuário')
            });
        }
        return usuario;
    }

    async deletar(id) {
        const data = await this.model.findByIdAndDelete(id);
        return data;
    }
}

export default UsuarioRepository;