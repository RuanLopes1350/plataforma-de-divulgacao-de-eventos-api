// src/services/UsuarioService.js

import UsuarioRepository from "../repositories/UsuarioRepository.js";
import { UsuarioUpdateSchema } from "../utils/validators/schemas/zod/UsuarioSchema.js";
import objectIdSchema from "../utils/validators/schemas/zod/ObjectIdSchema.js";
import TokenUtil from "../utils/TokenUtil.js";
import { emailDeBoasVindas } from "../utils/templates/emailTemplates.js";
import bcrypt from "bcryptjs";
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from "../utils/helpers/index.js";
import { enviarEmail } from "../utils/mailClient.js";

class UsuarioService {
    constructor() {
        this.repository = new UsuarioRepository();
        this.TokenUtil = TokenUtil; // Instância do TokenUtil para manipulação de tokens
    }

    // POST /usuario
    async cadastrar(dadosUsuario) {
        await this.validateEmail(dadosUsuario.email);

        // Gera uma senha temporária aleatória (usuário criará a própria senha via email)
        const senhaTempHash = await bcrypt.hash(Math.random().toString(36), 10);

        const dadosSeguros = {
            ...dadosUsuario,
            senha: senhaTempHash,
            status: 'inativo', // Inicia inativo até definir senha
        };

        const data = await this.repository.cadastrar(dadosSeguros);

        // Gera token de recuperação de senha (mesmo fluxo de recuperação)
        const tokenUnico = await this.TokenUtil.generatePasswordRecoveryToken(data._id);

        // Define expiração do token (1 hora)
        const expMs = Date.now() + 60 * 60 * 1000;
        await this.repository.alterar(data._id, {
            tokenUnico,
            exp_tokenUnico_recuperacao: new Date(expMs)
        });

        // Envia email com link para criar senha
        await enviarEmail(emailDeBoasVindas({
            email: data.email,
            nome: data.nome,
            token: tokenUnico
        }));

        return data;
    }

    async cadastrarAdminPadrao(dadosUsuario) {
        await this.validateEmail(dadosUsuario.email);

        // Aplica o Hash da senha ao cadastrar
        const senhaHash = await bcrypt.hash(dadosUsuario.senha, 10);

        const dadosSeguros = {
            ...dadosUsuario,
            senha: senhaHash,
        };

        const data = await this.repository.cadastrar(dadosSeguros);

        return data;
    }

    // GET /usuario && GET /usuario/:id
    async listar(req) {
        if (typeof req === 'string') {
            // Se vier ID, busca usuário por ID
            const data = await this.repository.listarPorId(req);
            return data;
        }

        // Caso contrário, é um objeto request e queremos listar todos
        const data = await this.repository.listar();
        return data;
    }

    /**
     * Atualiza um usuário existente.
     * Atenção: É proibido alterar o email. No serviço o objeto sempre chegará sem, pois o controller impedirá.
    */
    // PATCH /usuario/:id
    async alterar(id, parsedData) {
        /**
        * Verifica se o usuário existe.
        */
        await this.ensureUserExists(id);

        /**
        * Remove os campos que não podem ser atualizados.
        */
        delete parsedData.senha;
        delete parsedData.email;


        const data = await this.repository.alterar(id, parsedData);
        return data;
    }

    /**
     * Atualiza a senha de um usuário
     *
     * - Aceita **tokenRecuperacao** (JWT) ou **codigo_recupera_senha** (4 dígitos)
     * - Código expira após 60 min (verificado via `exp_codigo_recupera_senha`)
     */
    async atualizarSenha({ tokenRecuperacao = null, codigo_recupera_senha = null, senha }) {
        /* 1) Nenhum identificador */
        if (!tokenRecuperacao && !codigo_recupera_senha) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'tokenRecuperacao / codigo_recupera_senha',
                details: [],
                customMessage:
                    'Informe o token de recuperação ou o código de recuperação.',
            });
        }


        let usuarioId;

        /* ─── A) Código de 4 caracteres ───────────────────────────── */
        if (codigo_recupera_senha) {
            const usuario = await this.repository.buscarPorCodigoRecuperacao(codigo_recupera_senha);

            if (!usuario) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.NOT_FOUND.code,
                    errorType: 'validationError',
                    field: 'codigo_recupera_senha',
                    details: [
                        {
                            path: 'codigo_recupera_senha',
                            message: 'Código de recuperação inválido ou não encontrado.',
                        },
                    ],
                    customMessage: 'Código de recuperação inválido ou não encontrado.',
                });
            }

            /* Validação de expiração */
            const expTime = new Date(usuario.exp_codigo_recupera_senha).getTime();
            if (!expTime || expTime < Date.now()) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                    errorType: 'authenticationError',
                    field: 'codigo_recupera_senha',
                    details: [
                        {
                            path: 'codigo_recupera_senha',
                            message: 'Código de recuperação expirado.',
                        },
                    ],
                    customMessage: 'Código de recuperação expirado.',
                });
            }

            usuarioId = usuario._id.toString();
        }

        /* ─── B) Token JWT ────────────────────────────────────────── */
        if (tokenRecuperacao) {
            if (typeof tokenRecuperacao !== 'string' || !tokenRecuperacao.trim()) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'tokenRecuperacao',
                    details: [
                        {
                            path: 'tokenRecuperacao',
                            message: 'Token de recuperação inválido.',
                        },
                    ],
                    customMessage: 'Token de recuperação deve ser uma string não vazia.',
                });
            }

            let decoded;
            try {
                decoded = await this.TokenUtil.decodePasswordRecoveryToken(tokenRecuperacao);
            } catch (err) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.UNAUTHORIZED.code,
                    errorType: 'authenticationError',
                    field: 'tokenRecuperacao',
                    details: [],
                    customMessage: 'Token de recuperação expirado ou inválido.',
                });
            }

            if (!decoded.usuarioId) {
                throw new CustomError({
                    statusCode: HttpStatusCodes.BAD_REQUEST.code,
                    errorType: 'validationError',
                    field: 'tokenRecuperacao',
                    details: [],
                    customMessage: 'Payload do token não contém ID do usuário.',
                });
            }

            usuarioId = decoded.usuarioId;
        }

        /* 3) Valida ID e busca usuário */
        objectIdSchema.parse(usuarioId);

        const usuarioEncontrado = await this.repository.listarPorId(usuarioId);
        if (!usuarioEncontrado) {
            throw new CustomError({
                statusCode: HttpStatusCodes.NOT_FOUND.code,
                errorType: 'notFound',
                field: 'id',
                details: [],
                customMessage: 'Usuário não encontrado para alteração de senha.',
            });
        }

        /* 4) Valida / gera hash da nova senha */
        const { senha: senhaValidada } = UsuarioUpdateSchema.parse({ senha });
        const senhaHash = bcrypt.hash(senhaValidada, 10);

        /* 5) Persiste */
        await this.repository.atualizarSenha(usuarioId, senhaHash);

        /* 6) Remove código após uso */
        if (codigo_recupera_senha) {
            await this.repository.alterar(usuarioId, {
                codigo_recupera_senha: null,
                exp_codigo_recupera_senha: null,
            });
        }

        return { message: 'Senha atualizada com sucesso.' };
    }

    /**
     * Atualiza o status de um usuário e ao fazer "exclusão" apenas inativa, para dependência de eventos.
     */
    async alterarStatus(id, status) {
        await this.ensureUserExists(id);

        if (!['ativo', 'inativo'].includes(status)) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'status',
                customMessage: 'Status inválido. Use "ativo" ou "inativo".',
            });
        }

        const data = await this.repository.alterar(id, { status });
        return data;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // MÉTODOS AUXILIARES
    ////////////////////////////////////////////////////////////////////////////////

    /**
     * Valida a unicidade do email.
     */
    async validateEmail(email, id = null) {
        const usuarioExistente = await this.repository.buscarPorEmail(email, id);
        if (usuarioExistente && (!id || (usuarioExistente._id.equals ? !usuarioExistente._id.equals(id) : usuarioExistente._id !== id))) {
            throw new CustomError({
                statusCode: HttpStatusCodes.BAD_REQUEST.code,
                errorType: 'validationError',
                field: 'email',
                customMessage: 'Email já está em uso.'
            });
        }
    }

    /**
     * Garante que o usuário existe.
     */
    async ensureUserExists(id) {
        objectIdSchema.parse(id);
        const usuarioExistente = await this.repository.listarPorId(id);
        if (!usuarioExistente) {
            throw new CustomError({
                statusCode: 404,
                errorType: 'resourceNotFound',
                field: 'Usuario',
                details: [],
                customMessage: messages.error.resourceNotFound('Usuario'),
            });
        }
        return usuarioExistente;
    }

    async deletar(id) {
        if (id) {
            const data = await this.repository.deletar(id);
            return data;
        }
    }
}

export default UsuarioService;