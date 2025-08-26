// src/tests/unit/utils/SendMail.test.js

import SendMail from '../../../utils/SendMail';
import nodemailer from 'nodemailer';

// Mock do nodemailer
jest.mock('nodemailer');

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('SendMail', () => {
  let mockTransporter;
  let mockSendMailFn;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    
    mockSendMailFn = jest.fn().mockResolvedValue({ messageId: 'mock-id' });
    mockTransporter = { sendMail: mockSendMailFn };
    nodemailer.createTransport.mockReturnValue(mockTransporter);
    
    process.env.EMAIL_HOST = 'smtp.example.com';
    process.env.EMAIL_PORT = '587'; 
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'password123';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    delete process.env.DISABLED_EMAIL;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  describe('enviaEmail', () => {
    it('deve enviar um email com sucesso', async () => {
      const emailData = {
        to: 'destinatario@example.com',
        subject: 'Teste de Email',
        text: 'Conteúdo de texto do email',
        html: '<p>Conteúdo HTML do email</p>'
      };

      await SendMail.enviaEmail(emailData);
      
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: '587',
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123'
        }
      });
      
      expect(mockSendMailFn).toHaveBeenCalled();
      
      const callArgs = mockSendMailFn.mock.calls[0][0];
      expect(callArgs.from).toBe('test@example.com');
      expect(callArgs.to).toBe('destinatario@example.com');
      expect(callArgs.text).toBe('Conteúdo de texto do email');
      expect(callArgs.html).toBe('<p>Conteúdo HTML do email</p>');
      
      expect(callArgs.subject).toContain('Teste de Email');
    });

    it('deve retornar undefined se as variáveis de ambiente não estiverem configuradas', async () => {
      delete process.env.EMAIL_HOST;
      
      const emailData = {
        to: 'destinatario@example.com',
        subject: 'Teste',
        text: 'Teste'
      };

      const resultado = await SendMail.enviaEmail(emailData);

      expect(resultado).toBeUndefined();
      
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('deve retornar undefined se o serviço de email estiver desativado', async () => {
      process.env.DISABLED_EMAIL = 'true';
      
      const emailData = {
        to: 'destinatario@example.com',
        subject: 'Teste',
        text: 'Teste'
      };

      const resultado = await SendMail.enviaEmail(emailData);
      
      expect(resultado).toBeUndefined();
      
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('deve retornar objeto de erro se o envio de email falhar', async () => {

      mockSendMailFn.mockRejectedValue(new Error('Falha no envio de email'));
      
      const emailData = {
        to: 'destinatario@example.com',
        subject: 'Teste',
        text: 'Teste'
      };

      const resultado = await SendMail.enviaEmail(emailData);
      
      expect(resultado).toHaveProperty('error', true);
      expect(resultado).toHaveProperty('code', 500);
      expect(resultado).toHaveProperty('message', 'Erro interno do Servidor');
    });
  });

  describe('enviaEmailError', () => {
    it('deve enviar email de erro com sucesso', async () => {
      const erro = new Error('Erro de teste');
      erro.stack = 'Error: Erro de teste\n  at Test.test';
      
      const mockReq = {
        method: 'GET',
        protocol: 'http',
        get: jest.fn().mockReturnValue('example.com'),
        originalUrl: '/test'
      };
      
      await SendMail.enviaEmailError(erro, '/api/teste', new Date(), mockReq);
      
      expect(mockSendMailFn).toHaveBeenCalled();
      
      const callArgs = mockSendMailFn.mock.calls[0][0];
      expect(callArgs.from).toBe('test@example.com');
      expect(callArgs.to).toBe('admin@example.com');
      
      expect(callArgs.html).toContain('Erro de teste');
      
      expect(callArgs.subject).toContain('Erro interno do servidor');
    });

    it('deve retornar undefined se o serviço de email estiver desativado', async () => {
      process.env.DISABLED_EMAIL = 'true';
      
      const erro = new Error('Erro de teste');
      
      // Mock para req
      const mockReq = {
        method: 'GET',
        protocol: 'http',
        get: jest.fn().mockReturnValue('example.com'),
        originalUrl: '/test'
      };
      
      const resultado = await SendMail.enviaEmailError(erro, '/api/teste', new Date(), mockReq);
      
      expect(resultado).toBeUndefined();

      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });

  describe('enviaEmailErrorDbConect', () => {
    it('deve enviar email de erro de conexão com o banco', async () => {
      const erro = new Error('Erro de conexão');
      erro.stack = 'Error: Erro de conexão\n  at Database.connect';
      
      await SendMail.enviaEmailErrorDbConect(erro, '/api/dados', new Date());
      
      expect(mockSendMailFn).toHaveBeenCalled();
      
      const callArgs = mockSendMailFn.mock.calls[0][0];
      expect(callArgs.from).toBe('test@example.com');
      expect(callArgs.to).toBe('admin@example.com');
      
      expect(callArgs.html).toContain('Erro de conexão');
      
      expect(callArgs.subject).toContain('Erro interno do servidor');
    });

    it('deve retornar undefined se o serviço de email estiver desativado', async () => {
      process.env.DISABLED_EMAIL = 'true';
      
      const erro = new Error('Erro de conexão');
      const resultado = await SendMail.enviaEmailErrorDbConect(erro, '/api/dados', new Date());
      
      expect(resultado).toBeUndefined();
      
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });
  });
});