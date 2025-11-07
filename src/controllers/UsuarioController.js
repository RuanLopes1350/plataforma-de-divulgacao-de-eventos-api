// src/controllers/UsuarioController.js

import UsuarioService from '../services/UsuarioService.js';
import { UsuarioSchema, UsuarioUpdateSchema } from '../utils/validators/schemas/zod/UsuarioSchema.js';
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

  // POST /usuarios
  async cadastrar(req, res) {
    const parsedData = UsuarioSchema.parse(req.body);
    let data = await this.service.cadastrar(parsedData);

    let usuarioLimpo = data.toObject ? data.toObject() : { ...data };

    delete usuarioLimpo.senha; // Remove senha do objeto de resposta

    return CommonResponse.created(res, usuarioLimpo);
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