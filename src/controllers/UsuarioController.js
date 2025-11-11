// src/controllers/UsuarioController.js

import UsuarioService from '../services/UsuarioService.js';
import { UsuarioSchema, UsuarioCadastroSchema, UsuarioUpdateSchema } from '../utils/validators/schemas/zod/UsuarioSchema.js';
import objectIdSchema from '../utils/validators/schemas/zod/ObjectIdSchema.js';
import {
  CommonResponse,
  CustomError,
  HttpStatusCodes,
  errorHandler,
  messages,
  StatusService,
  asyncWrapper
} from '../utils/helpers/index.js';


class UsuarioController {
  constructor() {
    this.service = new UsuarioService();
  }

  // POST /usuarios (Admin cadastra usuário - envia email com token)
  async cadastrar(req, res) {
    const parsedData = UsuarioCadastroSchema.parse(req.body);
    let data = await this.service.cadastrar(parsedData);

    let usuarioLimpo = data.toObject ? data.toObject() : { ...data };

    delete usuarioLimpo.senha; // Remove senha do objeto de resposta
    delete usuarioLimpo.tokenUnico; // Remove token do objeto de resposta

    return CommonResponse.created(res, usuarioLimpo, 'Usuário cadastrado! Um email foi enviado para que ele defina sua senha.');
  };

  // POST /usuarios para rota signup
  async cadastrarComSenha(req, res) {
    const parsedData = UsuarioSchema.parse(req.body);
    let data = await this.service.cadastrar(parsedData);

    let usuarioLimpo = data.toObject ? data.toObject() : { ...data };

    return CommonResponse.created(res, usuarioLimpo);
  };

  // GET /usuarios && GET /usuarios/:id
  async listar(req, res) {
    const { id } = req.params;

    if (id) {
      objectIdSchema.parse(id);
      const data = await this.service.listar(id);

      if (!data) {
        throw new CustomError({
          message: messages.user.notFound(),
          statusCode: HttpStatusCodes.NOT_FOUND.code
        });
      }

      return CommonResponse.success(res, data);
    }

    const data = await this.service.listar(req);
    return CommonResponse.success(res, data);
  };

  //PATCH /usuarios/:id
  async alterar(req, res) {
    const { id } = req.params;
    objectIdSchema.parse(id);

    const parsedData = UsuarioUpdateSchema.parse(req.body);

    const data = await this.service.alterar(id, parsedData);

    let usuarioLimpo = data.toObject();

    delete usuarioLimpo.senha;

    return CommonResponse.success(res, usuarioLimpo, 200, 'Usuário atualizado com sucesso.');
  };

  // PATCH /usuarios/:id/status
  async alterarStatus(req, res) {
    const { id } = req.params;

    // Validação: verifica se o body existe e contém o campo status
    if (!req.body || !req.body.status) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'validationError',
        field: 'status',
        details: [{ path: 'status', message: 'O campo "status" é obrigatório no corpo da requisição.' }],
        customMessage: 'O campo "status" é obrigatório no corpo da requisição.'
      });
    }


    const { status } = req.body;

    objectIdSchema.parse(id);

    const data = await this.service.alterarStatus(id, status);

    return CommonResponse.success(res, data, 200, `Status do usuário atualizado para ${status}.`);
  }

  async alterarAdmin(req, res) {
    const { id } = req.params;
    objectIdSchema.parse(id);
    console.log(req.body);

    const { admin } = req.body;
    console.log(admin);
    // Validação: verifica se o body existe e contém o campo admin
    if (!req.body || !('admin' in req.body)) {
      throw new CustomError({
        statusCode: HttpStatusCodes.BAD_REQUEST.code,
        errorType: 'validationError',
        field: 'admin',
        details: [{ path: 'admin', message: 'O campo "admin" é obrigatório no corpo da requisição.' }],
        customMessage: 'O campo "admin" é obrigatório no corpo da requisição.'
      });
    }



    const data = await this.service.alterarAdmin(id, admin);

    if (admin === true) return CommonResponse.success(res, data, 200, `Usuário atualizado para Administrador!`);
    if (admin === false) return CommonResponse.success(res, data, 200, `Usuário retirado como Administrador!`);
  }

  async deletar(req, res) {
    const { id } = req.params;

    if (id) {
      objectIdSchema.parse(id);
      const data = await this.service.deletar(id);

      if (!data) {
        throw new CustomError({
          message: messages.user.notFound(),
          statusCode: HttpStatusCodes.NOT_FOUND.code
        });
      }

      return CommonResponse.success(res, data);
    }
  }
}
export default UsuarioController;