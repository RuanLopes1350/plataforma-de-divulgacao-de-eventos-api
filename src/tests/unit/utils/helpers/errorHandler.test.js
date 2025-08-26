// src/tests/unit/utils/helpers/errorHandler.test.js

import { jest } from '@jest/globals';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import errorHandler from '../../../../utils/helpers/errorHandler.js';
import CustomError from '../../../../utils/helpers/CustomError.js';
// import AuthenticationError from '../../../../utils/errors/AuthenticationError.js';
// import TokenExpiredError from '../../../../utils/errors/TokenExpiredError.js';
import CommonResponse from '../../../../utils/helpers/CommonResponse.js';
import logger from '../../../../utils/logger.js';

// Spy on logger (if needed)

jest.mock('../../../../utils/helpers/CommonResponse.js');

describe('errorHandler', () => {
    let req;
    let res;
    const next = jest.fn();

    beforeEach(() => {
        req = { path: '/test', requestId: 'test-req-id' };
        res = {}; // dummy, CommonResponse.error is being called instead
        CommonResponse.error.mockClear();
    });

    it('should handle ZodError and return 400 validationError', () => {
        const fakeError = new ZodError([{ path: ['field'], message: 'Invalid value' }]);
        process.env.NODE_ENV = 'development';
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            null,
            [{ path: 'field', message: 'Invalid value' }],
            'Erro de validação. 1 campo(s) inválido(s).'
        );
    });

    it('should handle MongoDB duplicate key error and return 409 duplicateEntry', () => {
        const fakeError = { code: 11000, keyValue: { email: 'test@example.com' } };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            409,
            'duplicateEntry',
            'email',
            [{ path: 'email', message: 'O valor "test@example.com" já está em uso.' }],
            'Entrada duplicada no campo "email".'
        );
    });

    it('should handle Mongoose ValidationError and return 400 validationError', () => {
        const fakeMongooseError = new mongoose.Error.ValidationError();
        fakeMongooseError.errors = {
            name: { path: 'name', message: 'Name is required' },
            age: { path: 'age', message: 'Age must be a number' }
        };

        errorHandler(fakeMongooseError, req, res, next);
        const detalhes = [
            { path: 'name', message: 'Name is required' },
            { path: 'age', message: 'Age must be a number' }
        ];

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            null,
            detalhes
        );
    });

    // it('should handle AuthenticationError and return its status and message', () => {
    //     const fakeError = new AuthenticationError('Not authenticated', 401);
    //     errorHandler(fakeError, req, res, next);

    //     expect(CommonResponse.error).toHaveBeenCalledWith(
    //         res,
    //         fakeError.statusCode,
    //         'authenticationError',
    //         null,
    //         [{ message: fakeError.message }],
    //         fakeError.message
    //     );
    // });

    // it('should handle TokenExpiredError and return its status and message', () => {
    //     const fakeError = new TokenExpiredError('Token expired', 401);
    //     errorHandler(fakeError, req, res, next);

    //     expect(CommonResponse.error).toHaveBeenCalledWith(
    //         res,
    //         fakeError.statusCode,
    //         'authenticationError',
    //         null,
    //         [{ message: fakeError.message }],
    //         fakeError.message
    //     );
    // });

    // it("should handle CustomError with errorType 'tokenExpired'", () => {
    //     const fakeError = new CustomError('Session expired', {
    //         errorType: 'tokenExpired',
    //         statusCode: 401,
    //         customMessage: 'Seu token expirou. Faça login novamente.'
    //     });
    //     errorHandler(fakeError, req, res, next);

    //     expect(CommonResponse.error).toHaveBeenCalledWith(
    //         res,
    //         401,
    //         'tokenExpired',
    //         null,
    //         [{ message: 'Seu token expirou. Faça login novamente.' }],
    //         'Seu token expirou. Faça login novamente.'
    //     );
    // });

    it('should handle operational errors', () => {
        const fakeError = new Error('Operational failure');
        fakeError.isOperational = true;
        fakeError.statusCode = 422;
        fakeError.errorType = 'operationalError';
        fakeError.details = [{ message: 'Detail info' }];
        fakeError.customMessage = 'Operacional Falhou';
        fakeError.field = 'someField';

        errorHandler(fakeError, req, res, next);
        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            422,
            'operationalError',
            'someField',
            [{ message: 'Detail info' }],
            'Operacional Falhou'
        );
    });

    it('should handle non-operational errors as internal errors', () => {
        const fakeError = new Error('Internal error occurred');
        process.env.NODE_ENV = 'development';
        errorHandler(fakeError, req, res, next);

        // In development, the error details include message and stack.
        const callArgs = CommonResponse.error.mock.calls[0];
        expect(callArgs[0]).toBe(res);
        expect(callArgs[1]).toBe(500);
        expect(callArgs[2]).toBe('serverError');
        // We check that details contain the error message and stack.
        expect(callArgs[4][0].message).toBe(fakeError.message);
        expect(callArgs[4][0].stack).toBeDefined();
    });

    it('should handle Multer LIMIT_FILE_SIZE error', () => {
        const fakeError = { code: 'LIMIT_FILE_SIZE' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            'file',
            [{ path: 'file', message: 'Arquivo muito grande. Tamanho máximo permitido: 25MB.' }],
            'Arquivo muito grande.'
        );
    });

    it('should handle Multer LIMIT_FILE_COUNT error', () => {
        const fakeError = { code: 'LIMIT_FILE_COUNT' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            'files',
            [{ path: 'files', message: 'Muitos arquivos enviados.' }],
            'Muitos arquivos enviados.'
        );
    });

    it('should handle Multer LIMIT_UNEXPECTED_FILE error', () => {
        const fakeError = { code: 'LIMIT_UNEXPECTED_FILE', field: 'avatar' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            'avatar',
            [{ path: 'avatar', message: 'Campo de arquivo inesperado: "avatar".' }],
            'Campo de arquivo não esperado.'
        );
    });

    it('should handle Multer file validation errors', () => {
        const fakeError = { message: 'Extensão inválida: .txt' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            'file',
            [{ path: 'file', message: 'Extensão inválida: .txt' }],
            'Arquivo inválido.'
        );
    });

    it('should handle MongoDB connection errors', () => {
        const fakeError = { name: 'MongoServerError', message: 'Connection failed' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            503,
            'serviceUnavailable',
            'database',
            [{ path: 'database', message: 'Serviço temporariamente indisponível. Tente novamente em alguns momentos.' }],
            'Serviço temporariamente indisponível.'
        );
    });

    it('should handle MongoDB network errors', () => {
        const fakeError = { name: 'MongoNetworkError', message: 'Network error' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            503,
            'serviceUnavailable',
            'database',
            [{ path: 'database', message: 'Serviço temporariamente indisponível. Tente novamente em alguns momentos.' }],
            'Serviço temporariamente indisponível.'
        );
    });

    it('should handle MongoDB timeout errors', () => {
        const fakeError = { name: 'MongoTimeoutError', message: 'Timeout error' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            503,
            'serviceUnavailable',
            'database',
            [{ path: 'database', message: 'Serviço temporariamente indisponível. Tente novamente em alguns momentos.' }],
            'Serviço temporariamente indisponível.'
        );
    });

    it('should handle connection buffering timeout errors', () => {
        const fakeError = { message: 'buffering timed out after 10000ms' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            503,
            'serviceUnavailable',
            'database',
            [{ path: 'database', message: 'Conexão com o banco de dados perdida. Tente novamente.' }],
            'Serviço temporariamente indisponível.'
        );
    });

    it('should handle connection closed errors', () => {
        const fakeError = { message: 'connection closed' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            503,
            'serviceUnavailable',
            'database',
            [{ path: 'database', message: 'Conexão com o banco de dados perdida. Tente novamente.' }],
            'Serviço temporariamente indisponível.'
        );
    });

    it('should handle no connection available errors', () => {
        const fakeError = { message: 'no connection available' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            503,
            'serviceUnavailable',
            'database',
            [{ path: 'database', message: 'Conexão com o banco de dados perdida. Tente novamente.' }],
            'Serviço temporariamente indisponível.'
        );
    });

    it('should handle JSON parsing errors', () => {
        const fakeError = { name: 'SyntaxError', message: 'Unexpected token' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            'body',
            [{ path: 'body', message: 'JSON inválido. Verifique a sintaxe do corpo da requisição.' }],
            'Formato JSON inválido.'
        );
    });

    it('should handle entity parse failed errors', () => {
        const fakeError = { type: 'entity.parse.failed', message: 'Parse error' };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            400,
            'validationError',
            'body',
            [{ path: 'body', message: 'JSON inválido. Verifique a sintaxe do corpo da requisição.' }],
            'Formato JSON inválido.'
        );
    });

    it('should handle duplicate key error without keyValue', () => {
        const fakeError = { code: 11000 };
        errorHandler(fakeError, req, res, next);

        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            409,
            'duplicateEntry',
            undefined,
            [{ path: undefined, message: 'O valor "duplicado" já está em uso.' }],
            'Entrada duplicada no campo "undefined".'
        );
    });

    it('should handle operational errors with default values', () => {
        const fakeError = new Error('Operational failure');
        fakeError.isOperational = true;
        fakeError.statusCode = 422;

        errorHandler(fakeError, req, res, next);
        expect(CommonResponse.error).toHaveBeenCalledWith(
            res,
            422,
            'operationalError',
            null,
            [],
            'Erro operacional.'
        );
    });

    it('should handle production environment for internal errors', () => {
        const fakeError = new Error('Internal error occurred');
        process.env.NODE_ENV = 'production';
        errorHandler(fakeError, req, res, next);

        // In production, the error details should not include the stack trace
        const callArgs = CommonResponse.error.mock.calls[0];
        expect(callArgs[0]).toBe(res);
        expect(callArgs[1]).toBe(500);
        expect(callArgs[2]).toBe('serverError');
        // Should contain a reference ID instead of the actual error message
        expect(callArgs[4][0].message).toContain('Erro interno do servidor. Referência:');
    });

    it('should handle file validation errors with different messages', () => {
        const errorMessages = [
            'Tipo de arquivo inválido',
            'Campo de mídia inválido',
            'Tipo de mídia inválido'
        ];

        errorMessages.forEach(message => {
            const fakeError = { message };
            errorHandler(fakeError, req, res, next);

            expect(CommonResponse.error).toHaveBeenCalledWith(
                res,
                400,
                'validationError',
                'file',
                [{ path: 'file', message }],
                'Arquivo inválido.'
            );
        });
    });

    it('should handle JSON parsing errors with different messages', () => {
        const errorMessages = [
            'is not valid JSON',
            'Unexpected token in JSON'
        ];

        errorMessages.forEach(message => {
            const fakeError = { message };
            errorHandler(fakeError, req, res, next);

            expect(CommonResponse.error).toHaveBeenCalledWith(
                res,
                400,
                'validationError',
                'body',
                [{ path: 'body', message: 'JSON inválido. Verifique a sintaxe do corpo da requisição.' }],
                'Formato JSON inválido.'
            );
        });
    });
});