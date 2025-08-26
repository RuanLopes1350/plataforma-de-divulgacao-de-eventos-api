// src/utils/helpers/errorHandler.js

import { ZodError } from 'zod';
import logger from '../logger.js';
import CommonResponse from './CommonResponse.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * Middleware para tratamento centralizado de erros.
 * Identifica o tipo de erro e envia uma resposta padronizada ao cliente.
 *
 * @param {Error} err - Erro lançado durante a execução.
 * @param {object} req - Objeto de requisição do Express.
 * @param {object} res - Objeto de resposta do Express.
 * @param {function} next - Função para repassar o controle para o próximo middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Verifica se o ambiente é de produção para ajustar a mensagem de erro
  const isProduction = process.env.NODE_ENV === 'production';
  // Gera um ID único para identificar o erro (útil para logs)
  const errorId = uuidv4();
  const requestId = req.requestId || 'N/A';

  // Tratamento para erros de validação do Zod
  if (err instanceof ZodError) {
    logger.warn('Erro de validação', { errors: err.errors, path: req.path, requestId });
    return CommonResponse.error(
      res,
      400,
      'validationError',
      null,
      err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
      `Erro de validação. ${err.errors.length} campo(s) inválido(s).`
    );
  }

  // Tratamento para erro de chave duplicada no MongoDB (código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = err.keyValue ? err.keyValue[field] : 'duplicado';
    logger.warn('Erro de chave duplicada', { field, value, path: req.path, requestId });
    return CommonResponse.error(
      res,
      409,
      'duplicateEntry',
      field,
      [{ path: field, message: `O valor "${value}" já está em uso.` }],
      `Entrada duplicada no campo "${field}".`
    );
  }

  // Tratamento para erros do Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    logger.warn('Erro Multer: arquivo muito grande', { path: req.path, requestId });
    return CommonResponse.error(
      res,
      400,
      'validationError',
      'file',
      [{ path: 'file', message: 'Arquivo muito grande. Tamanho máximo permitido: 25MB.' }],
      'Arquivo muito grande.'
    );
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    logger.warn('Erro Multer: muitos arquivos', { path: req.path, requestId });
    return CommonResponse.error(
      res,
      400,
      'validationError',
      'files',
      [{ path: 'files', message: 'Muitos arquivos enviados.' }],
      'Muitos arquivos enviados.'
    );
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    logger.warn('Erro Multer: campo inesperado', { field: err.field, path: req.path, requestId });
    return CommonResponse.error(
      res,
      400,
      'validationError',
      err.field,
      [{ path: err.field, message: `Campo de arquivo inesperado: "${err.field}".` }],
      'Campo de arquivo não esperado.'
    );
  }

  // Tratamento para erros personalizados do fileFilter do Multer
  if (err.message && (
    err.message.includes('Extensão inválida') ||
    err.message.includes('Tipo de arquivo inválido') ||
    err.message.includes('Campo de mídia inválido') ||
    err.message.includes('Tipo de mídia inválido')
  )) {
    logger.warn('Erro Multer: validação de arquivo', { message: err.message, path: req.path, requestId });
    return CommonResponse.error(
      res,
      400,
      'validationError',
      'file',
      [{ path: 'file', message: err.message }],
      'Arquivo inválido.'
    );
  }

  // Tratamento para erros de validação do Mongoose
  if (err instanceof mongoose.Error.ValidationError) {
    const detalhes = Object.values(err.errors).map(e => ({ path: e.path, message: e.message }));
    logger.warn('Erro de validação do Mongoose', { details: detalhes, path: req.path, requestId });
    return CommonResponse.error(res, 400, 'validationError', null, detalhes);
  }

  // Tratamento para erros do MongoDB (conexão, rede, timeout, etc.)
  if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    logger.error('Erro de conexão MongoDB', { message: err.message, name: err.name, path: req.path, requestId });
    return CommonResponse.error(
      res,
      503,
      'serviceUnavailable',
      'database',
      [{ path: 'database', message: 'Serviço temporariamente indisponível. Tente novamente em alguns momentos.' }],
      'Serviço temporariamente indisponível.'
    );
  }

  // Tratamento para estado de conexão perdida do Mongoose
  if (err.message?.includes('buffering timed out') || err.message?.includes('connection closed') || err.message?.includes('no connection available')) {
    logger.error('Erro de conexão perdida', { message: err.message, path: req.path, requestId });
    return CommonResponse.error(
      res,
      503,
      'serviceUnavailable',
      'database',
      [{ path: 'database', message: 'Conexão com o banco de dados perdida. Tente novamente.' }],
      'Serviço temporariamente indisponível.'
    );
  }

  // Tratamento para erros de parsing JSON do body-parser
  if (err.name === 'SyntaxError' || err.type === 'entity.parse.failed' || err.message?.includes('Unexpected token') || err.message?.includes('is not valid JSON')) {
    logger.warn('Erro de parsing JSON', { message: err.message, path: req.path, requestId });
    return CommonResponse.error(
      res,
      400,
      'validationError',
      'body',
      [{ path: 'body', message: 'JSON inválido. Verifique a sintaxe do corpo da requisição.' }],
      'Formato JSON inválido.'
    );
  }

  // Tratamento para erros operacionais (erros esperados na aplicação)
  if (err.isOperational) {
    logger.warn('Erro operacional', { message: err.message, path: req.path, requestId });
    return CommonResponse.error(
      res,
      err.statusCode,
      err.errorType || 'operationalError',
      err.field || null,
      err.details || [],
      err.customMessage || 'Erro operacional.'
    );
  }

  // Tratamento para erros internos (não operacionais)
  logger.error(`Erro interno [ID: ${errorId}]`, { message: err.message, stack: err.stack, requestId });
  const detalhes = isProduction
    ? [{ message: `Erro interno do servidor. Referência: ${errorId}` }]
    : [{ message: err.message, stack: err.stack }];

  return CommonResponse.error(res, 500, 'serverError', null, detalhes);
};

export default errorHandler;