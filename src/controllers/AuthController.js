// /src/controllers/AuthController.js

import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { CommonResponse, CustomError, HttpStatusCodes, errorHandler, messages, StatusService, asyncWrapper } from '../utils/helpers/index.js';
import { LoginSchema } from '../utils/validators/schemas/zod/LoginSchema.js';
import { UsuarioUpdateSchema } from '../utils/validators/schemas/zod/UsuarioSchema.js';

import AuthService from '../services/AuthService.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';

/**
   * Validação nesta aplicação segue o segue este artigo:
   * https://docs.google.com/document/d/1m2Ns1rIxpUzG5kRsgkbaQFdm7od0e7HSHfaSrrwegmM/edit?usp=sharing
*/
class AuthController {
  constructor() {
    this.service = new AuthService();
  }
  /**
   * Método para fazer o login do usuário
   */
  login = async (req, res) => {
    // 1º validação estrutural - validar os campos passados por body
    const body = req.body || {};
    const data = await this.service.login(body);
    return CommonResponse.success(res, data);
  }

  /**
   *  Metodo para recuperar a senha do usuário
   */
  recuperaSenha = async (req, res) => {
    // 1º validação estrutural - validar os campos passados por body
    const body = req.body || {};

    // Validar apenas o email
    const validatedBody = UsuarioUpdateSchema.parse(body);
    const data = await this.service.recuperaSenha(validatedBody);
    return CommonResponse.success(res, data);
  }

  /**
      * Atualiza a senha do próprio usuário em um cenário NÃO autenticado:
      *
      *   Normal (token único passado na URL como query: `?token=<JWT_PASSWORD_RECOVERY>`) 
      *    + { senha } no body.
      *    → Decodifica JWT, extrai usuarioId, salva o hash da nova senha mesmo que usuário esteja inativo.
      *
    */
  async atualizarSenhaToken(req, res, next) {
    const tokenRecuperacao = req.query.token || req.params.token || null; // token de recuperação passado na URL
    const senha = req.body.senha || null; // nova senha passada no body

    // 1) Verifica se veio o token de recuperação
    if (!tokenRecuperacao) {
      throw new CustomError({
        statusCode: HttpStatusCodes.UNAUTHORIZED.code,
        errorType: 'unauthorized',
        field: 'authentication',
        details: [],
        customMessage:
          'Token de recuperação na URL como parâmetro ou query é obrigatório para troca da senha.'
      });
    }

    // Validar a senha com o schema
    const senhaSchema = UsuarioUpdateSchema.parse({ "senha": senha });

    // atualiza a senha 
    await this.service.atualizarSenhaToken(tokenRecuperacao, senhaSchema);

    return CommonResponse.success(
      res,
      null,
      HttpStatusCodes.OK.code, 'Senha atualizada com sucesso.',
      { message: 'Senha atualizada com sucesso via token de recuperação.' },
    );
  }

  /**
   * Método para fazer o refresh do token 
   */
  refresh = async (req, res) => {
    // Extrai do body o token
    const token = req.body.refresh_token;

    // Verifica se o cabeçalho Authorization está presente
    if (!token || token === 'null' || token === 'undefined') {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'invalidRefresh',
        field: 'Refresh',
        details: [],
        customMessage: 'Refresh token is missing.'
      });
    }

    // Verifica e decodifica o token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_REFRESH_TOKEN);


    // encaminha o token para o serviço
    const data = await this.service.refresh(decoded.id, token);
    return CommonResponse.success(res, data);
  }

  /**
   * Método para fazer o logout do usuário
   */
  logout = async (req, res) => {
    // Extrai o cabeçalho Authorization
    const token = req.body?.accesstoken || req.headers.authorization?.split(' ')[1];


    // Verifica se o token está presente e não é uma string inválida
    if (!token || token === 'null' || token === 'undefined') {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'invalidLogout',
        field: 'Logout',
        details: [],
        customMessage: HttpStatusCodes.BAD_REQUEST.message
      });
    }

    // Verifica e decodifica o access token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_ACCESS_TOKEN);

    // Verifica se o token decodificado contém o ID do usuário
    if (!decoded || !decoded.id) {
      throw new CustomError({
        statusCode: HttpStatusCodes.INVALID_TOKEN.code,
        errorType: 'notAuthorized',
        field: 'NotAuthorized',
        details: [],
        customMessage: HttpStatusCodes.INVALID_TOKEN.message
      });
    }

    objectIdSchema.parse(decoded.id);

    // Encaminha o token para o serviço de logout
    const data = await this.service.logout(decoded.id, token);

    // Retorna uma resposta de sucesso
    return CommonResponse.success(res, null, messages.success.logout);
  }
}

export default AuthController;