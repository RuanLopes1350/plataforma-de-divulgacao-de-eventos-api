// src/tests/unit/middleware/AuthMiddleware.test.js

const mocks = {
  carregatokens: null
};

// Mocks básicos
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('util', () => ({
  promisify: jest.fn(fn => fn)
}));

// Mock de CustomError
jest.mock('../../../utils/helpers/index.js', () => ({
  CustomError: class CustomError extends Error {
    constructor(message, customMessage, statusCode = 400) {
      super(message);
      this.customMessage = customMessage;
      this.statusCode = statusCode;
    }
  }
}));

// Mock dos erros de autenticação
jest.mock('../../../utils/errors/AuthenticationError.js', () => {
  return class AuthenticationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'AuthenticationError';
      this.statusCode = 401;
    }
  }
});

jest.mock('../../../utils/errors/TokenExpiredError.js', () => {
  return class TokenExpiredError extends Error {
    constructor(message) {
      super(message);
      this.name = 'TokenExpiredError';
      this.statusCode = 401;
    }
  }
});

jest.mock('../../../services/AuthService.js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      carregatokens: (...args) => {
        if (mocks.carregatokens) {
          return mocks.carregatokens(...args);
        }
        return Promise.resolve({ data: { refreshtoken: null } });
      },
      repository: {
        listarPorId: jest.fn().mockResolvedValue({
          _id: 'user-123',
          nome: 'Test User',
          email: 'test@example.com'
        })
      }
    };
  });
});

// Importações
import jwt from 'jsonwebtoken';
import AuthService from '../../../services/AuthService.js';
import authMiddleware from '../../../middlewares/AuthMiddleware.js';
import { CustomError } from '../../../utils/helpers/index.js';
import AuthenticationError from '../../../utils/errors/AuthenticationError.js';
import TokenExpiredError from '../../../utils/errors/TokenExpiredError.js';

describe('AuthMiddleware', () => {
  let req, res, next;
  
  const originalEnv = process.env.JWT_SECRET_ACCESS_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    mocks.carregatokens = jest.fn();

    req = {
      headers: {},
      method: 'GET',
      path: '/teste',
      user_id: null
    };
    res = {};
    next = jest.fn();
    
    process.env.JWT_SECRET_ACCESS_TOKEN = 'test-secret';
  });
  
  afterEach(() => {
    process.env.JWT_SECRET_ACCESS_TOKEN = originalEnv;
    mocks.carregatokens = null;
  });

  describe('Rotas GET para eventos (Públicas)', () => {
    beforeEach(() => {
      req.method = 'GET';
      req.path = '/eventos/123';
    });

    it('deve permitir acesso sem token para rotas GET de eventos', async () => {
      await authMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user_id).toBeNull();
    });

    it('deve anexar user_id à requisição se o token for válido', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      jwt.verify.mockReturnValue({ id: 'user-123' });
      
      mocks.carregatokens.mockResolvedValue({
        data: { accesstoken: 'valid-access-token' }
      });

      await authMiddleware(req, res, next);

      expect(jwt.verify.mock.calls[0][0]).toBe('valid-token');
      expect(req.user_id).toBe('user-123');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('deve permitir acesso mesmo com token inválido', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      jwt.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalled();
      expect(req.user_id).toBeNull();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rotas protegidas (requerem autenticação)', () => {
    beforeEach(() => {
      req.method = 'POST';
      req.path = '/usuarios';
    });

    it('deve rejeitar requisições sem token', async () => {
      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
      expect(next.mock.calls[0][0].message).toBe("Token não informado!");
    });

    it('deve rejeitar tokens com formato inválido', async () => {
      req.headers.authorization = 'Invalid token';
      
      const jwtError = new Error('Token inválido');
      jwtError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw jwtError;
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'AuthenticationError',
        message: "Token JWT inválido!"
      }));
    });

    it('deve processar um token válido corretamente', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      jwt.verify.mockReturnValue({ id: 'user-123' });

      mocks.carregatokens.mockResolvedValue({
        data: { refreshtoken: 'valid-refresh-token' }
      });

      await authMiddleware(req, res, next);

      expect(jwt.verify.mock.calls[0][0]).toBe('valid-token');
      expect(mocks.carregatokens).toHaveBeenCalledWith('user-123');
      expect(req.user_id).toBe('user-123');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('deve rejeitar token sem refreshtoken válido', async () => {
        req.headers.authorization = 'Bearer valid-token';
        
        jwt.verify.mockReturnValue({ id: 'user-123' });

        mocks.carregatokens.mockResolvedValue({
            data: { refreshtoken: null }
        });

        await authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalled();
        expect(mocks.carregatokens).toHaveBeenCalled();
        
        expect(next).toHaveBeenCalledWith(expect.any(Object));
        
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
            statusCode: expect.any(Number)
            })
        );
    });

    it('deve rejeitar quando scheme é Bearer mas token está vazio', async () => {
      req.headers.authorization = 'Bearer ';
      
      const jwtError = new Error('Token vazio');
      jwtError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw jwtError;
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'AuthenticationError',
        message: "Token JWT inválido!"
      }));
  });
});

  describe('Tratamento de erros de JWT', () => {
    beforeEach(() => {
      req.method = 'POST';
      req.path = '/usuarios';
      req.headers.authorization = 'Bearer token';
    });

    it('deve tratar erro de token JWT inválido', async () => {
      const error = new Error('invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
      expect(next.mock.calls[0][0].message).toBe("Token JWT inválido!");
    });

    it('deve tratar erro de token JWT expirado', async () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(TokenExpiredError));
      expect(next.mock.calls[0][0].message).toBe("Token JWT expirado, faça login novamente.");
    });

    it('deve passar outros erros para o próximo middleware', async () => {
      const error = new Error('Outro erro');
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('deve tratar token decodificado como null/undefined', async () => {
      req.method = 'POST';
      req.path = '/usuarios';
      req.headers.authorization = 'Bearer valid-token';
      
      jwt.verify.mockReturnValue(null);

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(TokenExpiredError));
      expect(next.mock.calls[0][0].message).toBe("Token JWT expirado, faça login novamente.");
    });
  });
});