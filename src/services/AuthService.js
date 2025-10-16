// /src/services/AuthService.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from '../utils/helpers/index.js';
import tokenUtil from '../utils/TokenUtil.js';
import { v4 as uuid } from 'uuid';
import TokenUtil from '../utils/TokenUtil.js';
import AuthHelper from '../utils/AuthHelper.js';

import UsuarioRepository from '../repositories/UsuarioRepository.js';
import { enviarEmail } from '../utils/mailClient.js';

class AuthService {
    constructor({ tokenUtil: injectedTokenUtil } = {}) {
        // Se nada for injetado, usa a instância importada
        this.TokenUtil = injectedTokenUtil || tokenUtil;
        this.repository = new UsuarioRepository();
    }

    async carregatokens(id, token) {
        const data = await this.repository.listarPorId(id, { includeTokens: true });
        return { data };
    }

    async logout(id, token) {
        const data = await this.repository.removeToken(id);
        return { data };
    }

    async login(body) {
        // Buscar o usuário pelo email
        const userEncontrado = await this.repository.buscarPorEmail(body.email);
        if (!userEncontrado) {

            /**
             * Se o usuário não for encontrado, lança um erro personalizado
             * É importante para bibliotecas de requisições como DIO, Retrofit, Axios, etc. que o 
             * statusCode seja 401, pois elas tratam esse código como não autorizado
             * Isso é importante para que o usuário saiba que o email ou senha estão incorretos
             * Se o statusCode for 404, a biblioteca não irá tratar como não autorizado
             * Portanto, é importante que o statusCode seja 401
            */
            throw new CustomError({
                statusCode: 401,
                errorType: 'notFound',
                field: 'Email',
                details: [],
                customMessage: messages.error.unauthorized('Senha ou Email')
            });
        }

        // Validar a senha
        const senhaValida = await bcrypt.compare(body.senha, userEncontrado.senha);
        if (!senhaValida) {
            throw new CustomError({
                statusCode: 401,
                errorType: 'unauthorized',
                field: 'Senha',
                details: [],
                customMessage: messages.error.unauthorized('Senha ou Email')
            });
        }

        // Gerar novo access token utilizando a instância injetada
        const accesstoken = await this.TokenUtil.generateAccessToken(userEncontrado._id);

        // Buscar o usuário com os tokens já armazenados
        const userComTokens = await this.repository.listarPorId(userEncontrado._id, true);
        let refreshtoken = userComTokens.refreshtoken;

        if (refreshtoken) {
            try {
                jwt.verify(refreshtoken, process.env.JWT_SECRET_REFRESH_TOKEN);
            } catch (error) {
                if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
                    refreshtoken = await this.TokenUtil.generateRefreshToken(userEncontrado._id);
                } else {
                    throw new CustomError({
                        statusCode: 500,
                        errorType: 'serverError',
                        field: 'Token',
                        details: [],
                        customMessage: messages.error.unauthorized('falha na geração do token')
                    });
                }
            }
        } else {
            // Se o refresh token não existe, gera um novo
            refreshtoken = await this.TokenUtil.generateRefreshToken(userEncontrado._id);
        }

        // Armazenar os tokens atualizados
        await this.repository.armazenarTokens(userEncontrado._id, accesstoken, refreshtoken);

        // Buscar novamente o usuário e remover a senha
        const userLogado = await this.repository.buscarPorEmail(body.email);
        delete userLogado.senha;
        const userObjeto = userLogado.toObject();

        // Retornar o usuário com os tokens
        return { user: { accesstoken, refreshtoken, ...userObjeto } };
    }


    // RecuperaSenhaService.js
    async recuperaSenha(body) {
        // ───────────────────────────────────────────────
        // Passo 1 – Buscar usuário pelo e-mail informado
        // ───────────────────────────────────────────────
        const userEncontrado = await this.repository.buscarPorEmail(body.email);

        // Se não encontrar, lança erro 404
        if (!userEncontrado) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                field: 'Email',
                details: [],
                customMessage: HttpStatusCodes.NOT_FOUND.message
            });
        }

        // ───────────────────────────────────────────────
        // Passo 2 – Gerar token único (JWT) p/ recuperação
        // ───────────────────────────────────────────────
        const tokenUnico =
            await this.TokenUtil.generatePasswordRecoveryToken(userEncontrado._id);

        // ───────────────────────────────────────────────
        // Passo 3 – Persistir token no usuário
        // ───────────────────────────────────────────────
        const expMs = Date.now() + 60 * 60 * 1000; // 1 hora de expiração
        const data = await this.repository.alterar(userEncontrado._id, {
            tokenUnico,
            exp_tokenUnico_recuperacao: new Date(expMs)
        });

        if (!data) {
            // Falha ao atualizar → erro 500
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                field: 'Recuperação de Senha',
                details: [],
                customMessage: HttpStatusCodes.INTERNAL_SERVER_ERROR.message
            });
        }

        // ───────────────────────────────────────────────
        // Passo 4 – Retornar resposta ao cliente
        // ───────────────────────────────────────────────
        
        //enviar email com o link de recuperação (com o token único na query string)
        // Exemplo de link: https://meusite.com/recover-password?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

        // let email = {
        //     to = 
        //     subject =
        //     template =
        //     data = {

        //     }
        // }

        enviarEmail()
        

        // um novo serviço de notificação conforme necessário.
        console.log('Token de recuperação gerado:', tokenUnico);
        
        return {
            message: 'Solicitação de recuperação de senha recebida.',
            token: tokenUnico // Retornando o token para testes/desenvolvimento
        };
    }

    /**
     * Atualiza a senha do próprio usuário em um cenário NÃO autenticado:
     *
     * 1) Normal (token único passado na URL como query: `?token=<JWT_PASSWORD_RECOVERY>`) 
     *    + { senha } no body.
     *    → Decodifica JWT, extrai usuarioId, salva o hash da nova senha mesmo que usuário esteja inativo.
     */
    async atualizarSenhaToken(tokenRecuperacao, senhaBody) {
        // 1) Decodifica o token para obter o ID do usuário
        const usuarioId = await this.TokenUtil.decodePasswordRecoveryToken(
            tokenRecuperacao,
            process.env.JWT_SECRET_PASSWORD_RECOVERY
        );

        // 2) Gera o hash da senha pura
        const senhaHasheada = await AuthHelper.hashPassword(senhaBody.senha);

        // Buscar usuário pelo token unico
        const usuario = await this.repository.buscarPorTokenUnico(tokenRecuperacao);
        if (!usuario) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                field: 'Token',
                details: [],
                customMessage: "Token de recuperação já foi utilizado ou é inválido."
            }); 
        }

        // 2) Verifica expiração
        if (usuario.exp_tokenUnico_recuperacao < new Date()) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                field: 'Token de Recuperação',
                details: [],
                customMessage: 'Token de recuperação expirado.'
            });
        }

        // 3) Atualiza no repositório (já com hash)
        const usuarioAtualizado = await this.repository.atualizarSenha(usuarioId, senhaHasheada);
        if (!usuarioAtualizado) {
            throw new CustomError({
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                field: 'Senha',
                details: [],
                customMessage: 'Erro ao atualizar a senha.'
            });
        }

        return { message: 'Senha atualizada com sucesso.' };
    }

    async refresh(id, token) {
        const userEncontrado = await this.repository.listarPorId(id, { includeTokens: true });

        if (!userEncontrado) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                field: 'Token',
                details: [],
                customMessage: HttpStatusCodes.NOT_FOUND.message
            });
        }

        if (userEncontrado.refreshtoken !== token) {
            throw new CustomError({
                statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                errorType: 'invalidToken',
                field: 'Token',
                details: [],
                customMessage: messages.error.unauthorized('Token')
            });
        }

        // Gerar novo access token utilizando a instância injetada
        const accesstoken = await this.TokenUtil.generateAccessToken(id);

        /**
         * Se SINGLE_SESSION_REFRESH_TOKEN for true, gera um novo refresh token
         * Senão, mantém o token armazenado
         */
        let refreshtoken = '';
        if (process.env.SINGLE_SESSION_REFRESH_TOKEN === 'true') {
            refreshtoken = await this.TokenUtil.generateRefreshToken(id);
        } else {
            refreshtoken = userEncontrado.refreshtoken;
        }

        // Atualiza o usuário com os novos tokens
        await this.repository.armazenarTokens(id, accesstoken, refreshtoken);

        // monta o objeto de usuário com os tokens para resposta
        const userLogado = await this.repository.listarPorId(id, { includeTokens: true });
        delete userLogado.senha;
        const userObjeto = userLogado.toObject();

        const userComTokens = {
            accesstoken,
            refreshtoken,
            ...userObjeto
        };

        return { user: userComTokens };
    }
}

export default AuthService;