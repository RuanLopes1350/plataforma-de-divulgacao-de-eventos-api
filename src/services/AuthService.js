// /src/services/AuthService.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from '../utils/helpers/index.js';
import tokenUtil from '../utils/TokenUtil.js';
import { v4 as uuid } from 'uuid';
import SendMail from '../utils/SendMail.js';
import TokenUtil from '../utils/TokenUtil.js';
import AuthHelper from '../utils/AuthHelper.js';
import MailServiceClient from '../utils/MailServiceClient.js';

import UsuarioRepository from '../repositories/UsuarioRepository.js';

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
        // Passo 4 – Enviar e-mail com token + link
        // ───────────────────────────────────────────────
        /**
         * Usar CHAVE MAIL_API_KEY no .env para requisitar o envio de e-mail em https://edurondon.tplinkdns.com/mail/emails/send
         * Exemplo de corpo do e-mail:
         * Corpo do e-mail:
         * {
            "to": "falecomgilberto@gmail.com",
            "subject": "Redefinir senha",
            "template": "password-reset",
            "data": {
                "name": "Gilberto",
                "resetUrl": "https://edurondon.tplinkdns.com?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yJpZCI6IjY4NDFmNWVhMmQ5YWYxOWVlN2Y1YmY3OCIsImlhdCI6MTc0OTU2OTI1MiwiZXhwIjoxNzQ5NTcyODUyfQ.D_bW22QyKqZ2YL6lv7kRo-_zY54v3esNHsxK7DKeOq0",
                "expirationMinutes": 30,
                "year": 2025,
                "company": "Exemplo Ltda"
                }
            }
         * 
         */

        const resetUrl = `${process.env.SYSTEM_URL}/auth/?token=${tokenUnico}`;
        console.log('URL de redefinição de senha:', resetUrl);
        const emailData = {
            to: userEncontrado.email,
            subject: 'Redefinir senha',
            template: 'password-reset',
            data: {
                name: userEncontrado.nome,
                resetUrl: resetUrl,
                expirationMinutes: 60, // Expiração em minutos
                year: new Date().getFullYear(),
                company: process.env.COMPANY_NAME || 'Plataforma de Eventos'
            }
        };
        console.log('Dados do e-mail:', emailData);


        // Criar função para fazer a chamada para enviar o e-mail
        // Necessário passar apiKey presente em MAIL_API_KEY
        const sendMail = async (emailData) => {
            console.log('Enviando e-mail de recuperação de senha para:', emailData.to);
            
            // Implementar timeout configurável
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), process.env.MAIL_API_TIMEOUT || 30000);
            
            try {
                const response = await fetch(`${process.env.MAIL_API_URL}/emails/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.MAIL_API_KEY
                    },
                    body: JSON.stringify(emailData),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Erro ao enviar e-mail: ${response.status} ${response.statusText} - ${errorText}`);
                }
                
                const responseData = await response.json();
                console.log('E-mail enviado com sucesso:', responseData);
                
            } catch (error) {
                clearTimeout(timeoutId);
                console.error('Erro ao enviar e-mail:', error);
                
                if (error.name === 'AbortError') {
                    throw new CustomError({
                        statusCode: HttpStatusCodes.REQUEST_TIMEOUT.code,
                        field: 'E-mail',
                        details: [],
                        customMessage: 'Timeout: Serviço de e-mail não respondeu em tempo hábil.'
                    });
                }
                
                throw new CustomError({
                    statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR.code,
                    field: 'E-mail',
                    details: [],
                    customMessage: 'Erro ao enviar e-mail de recuperação de senha.'
                });
            }
        };

        console.log('Antes de sendMail');
        await sendMail(emailData);
        console.log('Depois de sendMail');

        console.log('Enviando e-mail de recuperação de senha');

        // ───────────────────────────────────────────────
        // Passo 5 – Retornar resposta ao cliente
        // ───────────────────────────────────────────────
        return {
            message:
                'Solicitação de recuperação de senha recebida. Um e-mail foi enviado com instruções.'
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