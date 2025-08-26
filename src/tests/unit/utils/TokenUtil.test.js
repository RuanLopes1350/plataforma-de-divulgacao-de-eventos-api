// src/tests/unit/utils/TokenUtil.test.js

import tokenUtil from '../../../utils/TokenUtil';
import jwt from 'jsonwebtoken';

// Mock do jwt com suporte a diversos cenários de erro
jest.mock('jsonwebtoken', () => {
  // Criar erros específicos do JWT para testar
  const TokenExpiredError = class extends Error {
    constructor() {
      super('jwt expired');
      this.name = 'TokenExpiredError';
    }
  };
  
  const JsonWebTokenError = class extends Error {
    constructor() {
      super('invalid token');
      this.name = 'JsonWebTokenError';
    }
  };

  return {
    TokenExpiredError,
    JsonWebTokenError,
    sign: jest.fn((payload, secret, options, callback) => {
      if (typeof callback === 'function') {
        if (!payload || !payload.id || payload.id === '') {
          callback(new Error('ID inválido ou não fornecido'), null);
        } else if (!secret) {
          callback(new Error('Secret is required'), null);
        } else if (payload.id === 'error') {
          callback(new Error('Falha na geração do token'), null);
        } else if (payload.id === 'null') {
          callback(null, null);
        } else {
          callback(null, 'mocked-token-' + payload.id);
        }
      }
      return undefined;
    }),
    
    verify: jest.fn((token, secret, callback) => {
      if (!token || token === '') {
        callback(new Error('Token não fornecido'), null);
      } else if (typeof token !== 'string') {
        callback(new Error('Token deve ser uma string'), null);
      } else if (!secret) {
        callback(new Error('Secret is required'), null);
      } else if (token === 'expired-token') {
        callback(new TokenExpiredError(), null);
      } else if (token === 'malformed-token') {
        callback(new JsonWebTokenError(), null);
      } else if (token.includes('invalid')) {
        callback(new Error('Token inválido'), null);
      } else if (token === 'empty-payload') {
        callback(null, {});
      } else {
        callback(null, { id: token.includes('custom') ? 'custom-id' : '12345' });
      }
      return undefined;
    })
  };
});

describe('TokenUtil', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    process.env = { ...originalEnv };
    
    process.env.JWT_SECRET_ACCESS_TOKEN = 'access-secret';
    process.env.JWT_SECRET_REFRESH_TOKEN = 'refresh-secret';
    process.env.JWT_SECRET_PASSWORD_RECOVERY = 'recovery-secret';
    process.env.JWT_ACCESS_TOKEN_EXPIRATION = '15m';
    process.env.JWT_REFRESH_TOKEN_EXPIRATION = '7d';
    process.env.JWT_PASSWORD_RECOVERY_EXPIRATION = '1h';
  });
  
  afterAll(() => {
    process.env = { ...originalEnv };
  });

  describe('generateAccessToken', () => {
    it('deve gerar um token de acesso válido', async () => {
      const userId = '12345';
      const token = await tokenUtil.generateAccessToken(userId);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        'access-secret',
        { expiresIn: '15m' },
        expect.any(Function)
      );
      
      expect(token).toBe('mocked-token-12345');
    });

    it('deve lançar erro se a geração do token falhar', async () => {
      await expect(tokenUtil.generateAccessToken('error')).rejects.toThrow('Falha na geração do token');
    });
    
    it('deve lançar erro se o ID for inválido', async () => {
      await expect(tokenUtil.generateAccessToken()).rejects.toThrow();
      await expect(tokenUtil.generateAccessToken(null)).rejects.toThrow();
      await expect(tokenUtil.generateAccessToken('')).rejects.toThrow();
    });
    
    it('deve lançar erro se a chave secreta não estiver configurada', async () => {
      delete process.env.JWT_SECRET_ACCESS_TOKEN;
      await expect(tokenUtil.generateAccessToken('12345')).rejects.toThrow('Secret is required');
    });
    
    it('deve usar o tempo de expiração padrão se não estiver configurado', async () => {
      delete process.env.JWT_ACCESS_TOKEN_EXPIRATION;
      await tokenUtil.generateAccessToken('12345');
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '12345' },
        'access-secret',
        { expiresIn: '15m' },
        expect.any(Function)
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('deve gerar um token de refresh válido', async () => {
      const userId = '12345';
      const token = await tokenUtil.generateRefreshToken(userId);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        'refresh-secret',
        { expiresIn: '7d' },
        expect.any(Function)
      );
      
      expect(token).toBe('mocked-token-12345');
    });
    
    it('deve lançar erro se a geração do token falhar', async () => {
      await expect(tokenUtil.generateRefreshToken('error')).rejects.toThrow('Falha na geração do token');
    });
    
    it('deve lançar erro se a chave secreta não estiver configurada', async () => {
      delete process.env.JWT_SECRET_REFRESH_TOKEN;
      await expect(tokenUtil.generateRefreshToken('12345')).rejects.toThrow('Secret is required');
    });
    
    it('deve usar o tempo de expiração padrão se não estiver configurado', async () => {
      delete process.env.JWT_REFRESH_TOKEN_EXPIRATION;
      await tokenUtil.generateRefreshToken('12345');
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '12345' },
        'refresh-secret',
        { expiresIn: '7d' },
        expect.any(Function)
      );
    });
  });

  describe('generatePasswordRecoveryToken', () => {
    it('deve gerar um token de recuperação de senha válido', async () => {
      const userId = '12345';
      const token = await tokenUtil.generatePasswordRecoveryToken(userId);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        'recovery-secret',
        { expiresIn: '1h' },
        expect.any(Function)
      );
      
      expect(token).toBe('mocked-token-12345');
    });
    
    it('deve lançar erro se a geração do token falhar', async () => {
      await expect(tokenUtil.generatePasswordRecoveryToken('error')).rejects.toThrow('Falha na geração do token');
    });
    
    it('deve lançar erro se a chave secreta não estiver configurada', async () => {
      delete process.env.JWT_SECRET_PASSWORD_RECOVERY;
      await expect(tokenUtil.generatePasswordRecoveryToken('12345')).rejects.toThrow('Secret is required');
    });
    
    it('deve usar o tempo de expiração padrão se não estiver configurado', async () => {
      delete process.env.JWT_PASSWORD_RECOVERY_EXPIRATION;
      await tokenUtil.generatePasswordRecoveryToken('12345');
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '12345' },
        'recovery-secret',
        { expiresIn: '30m' },
        expect.any(Function)
      );
    });
  });
  
  describe('decodeAccessToken', () => {
    it('deve decodificar um token de acesso válido', async () => {
      const token = 'valid-access-token';
      const result = await tokenUtil.decodeAccessToken(token);
      
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        'access-secret',
        expect.any(Function)
      );
      
      expect(result).toBe('12345');
    });

    it('deve lançar erro se o token for inválido', async () => {
      await expect(tokenUtil.decodeAccessToken('invalid-token')).rejects.toThrow('Token inválido');
    });
    
    it('deve lançar erro se o token estiver expirado', async () => {
      await expect(tokenUtil.decodeAccessToken('expired-token')).rejects.toThrow('jwt expired');
    });
    
    it('deve lançar erro se o token estiver malformado', async () => {
      await expect(tokenUtil.decodeAccessToken('malformed-token')).rejects.toThrow('invalid token');
    });
    
    it('deve lançar erro se a chave secreta não estiver configurada', async () => {
      delete process.env.JWT_SECRET_ACCESS_TOKEN;
      await expect(tokenUtil.decodeAccessToken('valid-access-token')).rejects.toThrow('Secret is required');
    });
    
    it('deve retornar undefined se o payload não contiver ID', async () => {
      const result = await tokenUtil.decodeAccessToken('empty-payload');
      expect(result).toBeUndefined();
    });
    
    it('deve retornar o ID customizado do payload', async () => {
      const result = await tokenUtil.decodeAccessToken('custom-access-token');
      expect(result).toBe('custom-id');
    });
  });

  describe('decodeRefreshToken', () => {
    it('deve decodificar um token de refresh válido', async () => {
      const token = 'valid-refresh-token';
      const result = await tokenUtil.decodeRefreshToken(token);
      
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        'refresh-secret',
        expect.any(Function)
      );
      
      expect(result).toBe('12345');
    });
    
    it('deve lançar erro se o token for inválido', async () => {
      await expect(tokenUtil.decodeRefreshToken('invalid-token')).rejects.toThrow('Token inválido');
    });
    
    it('deve lançar erro se o token estiver expirado', async () => {
      await expect(tokenUtil.decodeRefreshToken('expired-token')).rejects.toThrow('jwt expired');
    });
    
    it('deve lançar erro se a chave secreta não estiver configurada', async () => {
      delete process.env.JWT_SECRET_REFRESH_TOKEN;
      await expect(tokenUtil.decodeRefreshToken('valid-refresh-token')).rejects.toThrow('Secret is required');
    });
  });

  describe('decodePasswordRecoveryToken', () => {
    it('deve decodificar um token de recuperação de senha válido', async () => {
      const token = 'valid-recovery-token';
      const result = await tokenUtil.decodePasswordRecoveryToken(token);
      
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        'recovery-secret',
        expect.any(Function)
      );
      
      expect(result).toBe('12345');
    });
    
    it('deve lançar erro se o token for inválido', async () => {
      await expect(tokenUtil.decodePasswordRecoveryToken('invalid-token')).rejects.toThrow('Token inválido');
    });
    
    it('deve lançar erro se o token estiver expirado', async () => {
      await expect(tokenUtil.decodePasswordRecoveryToken('expired-token')).rejects.toThrow('jwt expired');
    });
    
    it('deve lançar erro se a chave secreta não estiver configurada', async () => {
      delete process.env.JWT_SECRET_PASSWORD_RECOVERY;
      await expect(tokenUtil.decodePasswordRecoveryToken('valid-recovery-token')).rejects.toThrow('Secret is required');
    });
  });

  describe('comportamento com valores inesperados', () => {
    it('deve lidar com tokens nulos ou indefinidos', async () => {
      await expect(tokenUtil.decodeAccessToken()).rejects.toThrow();
      await expect(tokenUtil.decodeAccessToken(null)).rejects.toThrow();
      await expect(tokenUtil.decodeAccessToken('')).rejects.toThrow();
    });
    
    it('deve lidar com tokens de tipo incorreto', async () => {
      await expect(tokenUtil.decodeAccessToken(123)).rejects.toThrow();
      await expect(tokenUtil.decodeAccessToken({})).rejects.toThrow();
      await expect(tokenUtil.decodeAccessToken([])).rejects.toThrow();
    });
  });
});