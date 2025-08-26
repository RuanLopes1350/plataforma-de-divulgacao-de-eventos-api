// src/tests/unit/utils/validators/schemas/zod/UsuarioSchema.test.js

import { UsuarioSchema, UsuarioUpdateSchema } from '../../../../../../utils/validators/schemas/zod/UsuarioSchema.js';

describe('UsuarioSchema', () => {
  const usuarioValido = {
    nome: 'Usuário de Teste',
    email: 'usuario@teste.com',
    senha: 'Senha123@'
  };

  it('deve validar um usuário com todos os campos corretos', () => {
    const resultado = UsuarioSchema.safeParse(usuarioValido);
    expect(resultado.success).toBe(true);
  });

  describe('Validação de campos obrigatórios', () => {
    const obrigatorios = ['nome', 'email', 'senha'];

    obrigatorios.forEach(campo => {
      it(`deve falhar se o campo ${campo} não estiver presente`, () => {
        const usuarioInvalido = { ...usuarioValido };
        delete usuarioInvalido[campo];
        const resultado = UsuarioSchema.safeParse(usuarioInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain(campo);
      });
    });
  });

  describe('Validação de nome', () => {
    it('deve falhar se o nome for vazio', () => {
      const usuarioInvalido = { ...usuarioValido, nome: '' };
      const resultado = UsuarioSchema.safeParse(usuarioInvalido);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe('Campo nome é obrigatório.');
    });
  });

  describe('Validação de email', () => {
    it('deve falhar com formato de email inválido', () => {
      const usuarioInvalido = { ...usuarioValido, email: 'emailinvalido' };
      const resultado = UsuarioSchema.safeParse(usuarioInvalido);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe('Formato de email inválido.');
    });

    it('deve falhar se o email for vazio', () => {
      const usuarioInvalido = { ...usuarioValido, email: '' };
      const resultado = UsuarioSchema.safeParse(usuarioInvalido);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe('Formato de email inválido.');
    });
  });

  describe('Validação de senha', () => {
    it('deve falhar se a senha tiver menos de 8 caracteres', () => {
      const usuarioInvalido = { ...usuarioValido, senha: 'Senh1@' };
      const resultado = UsuarioSchema.safeParse(usuarioInvalido);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toBe('A senha deve ter pelo menos 8 caracteres.');
    });

    it('deve falhar se a senha não tiver letra maiúscula', () => {
      const usuarioInvalido = { ...usuarioValido, senha: 'senha123@' };
      const resultado = UsuarioSchema.safeParse(usuarioInvalido);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toContain('1 letra maiúscula');
    });

    it('deve falhar se a senha não tiver letra minúscula', () => {
      const usuarioInvalido = { ...usuarioValido, senha: 'SENHA123@' };
      const resultado = UsuarioSchema.safeParse(usuarioInvalido);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toContain('1 letra minúscula');
    });

    it('deve falhar se a senha não tiver número', () => {
      const usuarioInvalido = { ...usuarioValido, senha: 'SenhaTeste@' };
      const resultado = UsuarioSchema.safeParse(usuarioInvalido);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toContain('1 número');
    });

    it('deve falhar se a senha não tiver caractere especial', () => {
      const usuarioInvalido = { ...usuarioValido, senha: 'Senha1234' };
      const resultado = UsuarioSchema.safeParse(usuarioInvalido);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues[0].message).toContain('A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula, 1 número e no mínimo 8 caracteres.');
    });

    it('deve retornar os erros definidos no schema se vários campos forem inválidos', () => {
      const usuarioInvalido = {
        nome: '',
        email: 'invalido',
        senha: 'fraca'
      };
      const resultado = UsuarioSchema.safeParse(usuarioInvalido);
      expect(resultado.success).toBe(false);
      expect(resultado.error.issues.length).toBeGreaterThan(1);
    });
  });

  describe("Validação de status", () => {
    it("deve aceitar status 'ativo'", () => {
        const usuarioValidoComStatus = { ...usuarioValido, status: "ativo" };
        const resultado = UsuarioSchema.safeParse(usuarioValidoComStatus);
        expect(resultado.success).toBe(true);
    });

    it("deve aceitar status 'inativo'", () => {
        const usuarioValidoComStatus = { ...usuarioValido, status: "inativo" };
        const resultado = UsuarioSchema.safeParse(usuarioValidoComStatus);
        expect(resultado.success).toBe(true);
    });

    it("deve falhar se o status for inválido", () => {
        const usuarioInvalido = { ...usuarioValido, status: "indefinido" };
        const resultado = UsuarioSchema.safeParse(usuarioInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain("status");
    });
  });
});

describe('UsuarioUpdateSchema', () => {
  it('deve validar com sucesso todos os campos possíveis de update preenchidos corretamente', () => {
    const dadosUpdateValidos = {
      nome: 'Novo Nome de Usuário',
      email: 'novo@email.com',
      senha: 'NovaSenha123@'
    };

    const resultado = UsuarioUpdateSchema.safeParse(dadosUpdateValidos);
    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual(expect.objectContaining(dadosUpdateValidos));
  });

  it('deve aceitar qualquer campo parcial', () => {
    const dadosParciais = {
      nome: 'Novo Nome',
      email: 'novo@email.com'
    };
    const resultado = UsuarioUpdateSchema.safeParse(dadosParciais);
    expect(resultado.success).toBe(true);
  });

  it('deve falhar com valores inválidos mesmo parcialmente', () => {
    const usuarioInvalido = {
      email: 'email-inválido',
      senha: '123'
    };
    const resultado = UsuarioUpdateSchema.safeParse(usuarioInvalido);
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues.some(issue => issue.path.includes('email'))).toBe(true);
    expect(resultado.error.issues.some(issue => issue.path.includes('senha'))).toBe(true);
  });

  it('deve aceitar atualização apenas do nome', () => {
    const resultado = UsuarioUpdateSchema.safeParse({ nome: 'Novo Nome' });
    expect(resultado.success).toBe(true);
  });

  it('deve aceitar atualização apenas da senha', () => {
    const resultado = UsuarioUpdateSchema.safeParse({ senha: 'NovaSenha123@' });
    expect(resultado.success).toBe(true);
  });
});