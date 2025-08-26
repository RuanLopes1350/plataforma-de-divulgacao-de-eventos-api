// src/tests/unit/utils/AuthHelper.test.js

import AuthHelper from '../../../utils/AuthHelper';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock do bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn()
}));

// Mock do jwt
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn()
}));

describe('AuthHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('deve gerar hash de senha com salt 12', async () => {
      const senha = 'senha123';
      const senhaHash = 'senha_hasheada';
      
      bcrypt.hash.mockResolvedValue(senhaHash);
      
      const result = await AuthHelper.hashPassword(senha);
      
      expect(result).toBe(senhaHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(senha, 12);
    });

    it('deve propagar erro se bcrypt falhar', async () => {
      const erro = new Error('Falha ao gerar hash');
      bcrypt.hash.mockRejectedValue(erro);
      
      await expect(AuthHelper.hashPassword('senha123')).rejects.toThrow('Falha ao gerar hash');
    });

    it('deve funcionar com diferentes tipos de senha', async () => {
      const senhas = ['123456789', 'senha@complexa!', ''];
      const hashFake = 'hash_resultado';
      
      bcrypt.hash.mockResolvedValue(hashFake);
      
      for (const senha of senhas) {
        const result = await AuthHelper.hashPassword(senha);
        expect(result).toBe(hashFake);
        expect(bcrypt.hash).toHaveBeenCalledWith(senha, 12);
      }
    });
  });

  describe('decodeToken', () => {
    it('deve decodificar um token válido', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9.test';
      const decodedPayload = { id: '123', iat: 1234567890 };
      
      jwt.decode.mockReturnValue(decodedPayload);
      
      const result = AuthHelper.decodeToken(token);
      
      expect(result).toEqual(decodedPayload);
      expect(jwt.decode).toHaveBeenCalledWith(token);
    });

    it('deve retornar null para token inválido', () => {
      const tokenInvalido = 'token_invalido';
      
      jwt.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const result = AuthHelper.decodeToken(tokenInvalido);
      
      expect(result).toBeNull();
      expect(jwt.decode).toHaveBeenCalledWith(tokenInvalido);
    });

    it('deve retornar null para token vazio ou null', () => {
      jwt.decode.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      expect(AuthHelper.decodeToken('')).toBeNull();
      expect(AuthHelper.decodeToken(null)).toBeNull();
      expect(AuthHelper.decodeToken(undefined)).toBeNull();
    });

    it('deve lidar com erros de decodificação silenciosamente', () => {
      const token = 'token_que_causa_erro';
      
      jwt.decode.mockImplementation(() => {
        throw new Error('Token malformado');
      });
      
      const result = AuthHelper.decodeToken(token);
      
      expect(result).toBeNull();
      expect(jwt.decode).toHaveBeenCalledWith(token);
    });

    it('deve retornar dados corretos quando o token é válido mas vazio', () => {
      const token = 'token_vazio';
      
      jwt.decode.mockReturnValue(null);
      
      const result = AuthHelper.decodeToken(token);
      
      expect(result).toBeNull();
      expect(jwt.decode).toHaveBeenCalledWith(token);
    });
  });
});