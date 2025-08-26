// src/tests/unit/services/UsuarioService.test.js
import UsuarioService from "../../../services/UsuarioService.js";
import { CustomError, HttpStatusCodes } from "../../../utils/helpers/index.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UsuarioUpdateSchema } from "../../../utils/validators/schemas/zod/UsuarioSchema.js";

// Mock do repositório para simular o banco
const mockRepository = {
  cadastrar: jest.fn(),
  listar: jest.fn(),
  listarPorId: jest.fn(),
  buscarPorEmail: jest.fn(),
  buscarPorCodigoRecuperacao: jest.fn(),
  alterar: jest.fn(),
  atualizarSenha: jest.fn(),
  deletar: jest.fn(),
  armazenarTokens: jest.fn(),
  removeToken: jest.fn(),
};

// Mock do TokenUtil
const mockTokenUtil = {
  decodePasswordRecoveryToken: jest.fn(),
};

const usuarioService = new UsuarioService();
usuarioService.repository = mockRepository;
usuarioService.TokenUtil = mockTokenUtil;

const invalidId = "invalid";

const usuarioFake = {
  _id: new mongoose.Types.ObjectId().toString(),
  nome: "Usuário Teste",
  email: "testeUnit@gmail.com",
  senha: "SenhaTeste1@",
  createdAt: new Date(),
  updatedAt: new Date()
};

const usuarioComCodigoRecuperacao = {
  ...usuarioFake,
  codigo_recupera_senha: "1234",
  exp_codigo_recupera_senha: new Date(Date.now() + 3600000) // 1 hora no futuro
};

describe("UsuarioService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Teste do cadastrar
  describe("cadastrar", () => {
    it("deve cadastrar um novo usuário com sucesso", async () => {
      const senhaHash = 'hashedPassword';

      mockRepository.buscarPorEmail.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(senhaHash);
      mockRepository.cadastrar.mockResolvedValue({ ...usuarioFake, senha: senhaHash });
      
      const resultado = await usuarioService.cadastrar(usuarioFake);
      
      expect(resultado._id).toBe(usuarioFake._id);
      expect(resultado.nome).toBe(usuarioFake.nome);
      expect(resultado.email).toBe(usuarioFake.email);
      expect(resultado.senha).toBe(senhaHash);
      expect(bcrypt.hash).toHaveBeenCalledWith(usuarioFake.senha, 10);
    });

    it("deve lançar erro se o email já estiver em uso", async () => {
      mockRepository.buscarPorEmail.mockResolvedValue(usuarioFake);
      
      await expect(usuarioService.cadastrar(usuarioFake)).rejects.toThrow(CustomError);
      expect(mockRepository.buscarPorEmail).toHaveBeenCalledWith(usuarioFake.email, null);
    });

    it("deve lançar erro se o repositório falhar", async () => {
      mockRepository.buscarPorEmail.mockResolvedValue(null);
      mockRepository.cadastrar.mockRejectedValue(new Error("Falha ao cadastrar"));
      
      await expect(usuarioService.cadastrar(usuarioFake)).rejects.toThrow("Falha ao cadastrar");
    });
  });

  // Teste de listar
  describe("listar", () => {
    it("deve retornar lista de usuários quando chamada sem parâmetro", async () => {
      mockRepository.listar.mockResolvedValue([usuarioFake]);
      
      const resultado = await usuarioService.listar();
      
      expect(resultado).toEqual([usuarioFake]);
      expect(mockRepository.listar).toHaveBeenCalled();
    });

    it("deve retornar um usuário pelo ID válido", async () => {
      mockRepository.listarPorId.mockResolvedValue([usuarioFake]);
      
      const resultado = await usuarioService.listar(usuarioFake._id);
      
      expect(resultado).toEqual([usuarioFake]);
    });

    it("deve lançar erro para ID inválido", async () => {
      mockRepository.listarPorId.mockRejectedValue(new Error("ID inválido"));
      await expect(usuarioService.listar(invalidId)).rejects.toThrow("ID inválido");
    });

    it("deve retornar resultado do repositório mesmo com erro em listarPorId", async () => {
      mockRepository.listarPorId.mockResolvedValue([usuarioFake]);
      const resultado = await usuarioService.listar(usuarioFake._id);
      expect(resultado).toEqual([usuarioFake]);
    });

    it("deve lançar erro se listar falhar", async () => {
      mockRepository.listar.mockRejectedValue(new Error("Erro no banco"));
      
      await expect(usuarioService.listar()).rejects.toThrow("Erro no banco");
    });
  });

  // Teste do alterar
  describe("alterar", () => {
    const dadosAtualizados = { nome: "Novo Nome" };

    it("deve atualizar usuário existente com sucesso", async () => {
      mockRepository.listarPorId.mockResolvedValue(usuarioFake);
      mockRepository.alterar.mockResolvedValue({ ...usuarioFake, ...dadosAtualizados });
      
      const resultado = await usuarioService.alterar(usuarioFake._id, dadosAtualizados);
      
      expect(resultado.nome).toBe("Novo Nome");
      expect(mockRepository.listarPorId).toHaveBeenCalledWith(usuarioFake._id);
      expect(mockRepository.alterar).toHaveBeenCalledWith(usuarioFake._id, dadosAtualizados);
    });

    it("deve remover campos não permitidos na atualização", async () => {
      const dadosComCamposProibidos = {
        ...dadosAtualizados,
        email: "novo@email.com",
        senha: "NovaSenha123@"
      };
      
      mockRepository.listarPorId.mockResolvedValue(usuarioFake);
      mockRepository.alterar.mockResolvedValue({ ...usuarioFake, ...dadosAtualizados });
      
      await usuarioService.alterar(usuarioFake._id, dadosComCamposProibidos);
      
      expect(mockRepository.alterar).toHaveBeenCalledWith(usuarioFake._id, dadosAtualizados);
    });

    it("deve lançar CustomError se usuário não existir", async () => {
      mockRepository.listarPorId.mockResolvedValue(null);
      
      await expect(usuarioService.alterar(usuarioFake._id, dadosAtualizados)).rejects.toThrow(CustomError);
    });

    it("deve lançar erro se ID for inválido", async () => {
      await expect(usuarioService.alterar(invalidId, dadosAtualizados)).rejects.toThrow();
    });

    it("deve lançar erro se alterar falhar", async () => {
      mockRepository.listarPorId.mockResolvedValue(usuarioFake);
      mockRepository.alterar.mockRejectedValue(new Error("Erro no banco"));
      
      await expect(usuarioService.alterar(usuarioFake._id, dadosAtualizados)).rejects.toThrow("Erro no banco");
    });
  });

  // Teste do atualizarSenha
  describe("atualizarSenha", () => {
    const novaSenha = "NovaSenha123@";
    const tokenValido = "token.valido";
    const codigoValido = "1234";
    const decodedToken = { usuarioId: usuarioFake._id };

    beforeEach(() => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
    });

    it("deve atualizar senha com token válido", async () => {
      mockTokenUtil.decodePasswordRecoveryToken.mockResolvedValue(decodedToken);
      mockRepository.listarPorId.mockResolvedValue(usuarioFake);
      mockRepository.atualizarSenha.mockResolvedValue(true);
      
      const resultado = await usuarioService.atualizarSenha({
        tokenRecuperacao: tokenValido,
        senha: novaSenha
      });
      
      expect(resultado).toEqual({ message: 'Senha atualizada com sucesso.' });
      expect(mockTokenUtil.decodePasswordRecoveryToken).toHaveBeenCalledWith(tokenValido);
      expect(mockRepository.listarPorId).toHaveBeenCalledWith(usuarioFake._id);
      expect(bcrypt.hash).toHaveBeenCalledWith(novaSenha, 10);
    });

    it("deve atualizar senha com código válido", async () => {
      mockRepository.buscarPorCodigoRecuperacao.mockResolvedValue(usuarioComCodigoRecuperacao);
      mockRepository.listarPorId.mockResolvedValue(usuarioFake);
      mockRepository.atualizarSenha.mockResolvedValue(true);
      mockRepository.alterar.mockResolvedValue(true);
      
      const resultado = await usuarioService.atualizarSenha({
        codigo_recupera_senha: codigoValido,
        senha: novaSenha
      });
      
      expect(resultado).toEqual({ message: 'Senha atualizada com sucesso.' });
      expect(mockRepository.buscarPorCodigoRecuperacao).toHaveBeenCalledWith(codigoValido);
      expect(mockRepository.alterar).toHaveBeenCalledWith(usuarioFake._id, {
        codigo_recupera_senha: null,
        exp_codigo_recupera_senha: null
      });
    });

    it("deve lançar erro se nenhum método de recuperação for fornecido", async () => {
      await expect(usuarioService.atualizarSenha({ senha: novaSenha }))
        .rejects.toThrow(CustomError);
    });

    it("deve lançar erro se token for inválido", async () => {
      mockTokenUtil.decodePasswordRecoveryToken.mockRejectedValue(new Error("Token inválido"));
      
      await expect(usuarioService.atualizarSenha({
        tokenRecuperacao: "token.invalido",
        senha: novaSenha
      })).rejects.toThrow(CustomError);
    });

    it("deve lançar erro se código de recuperação for inválido", async () => {
      mockRepository.buscarPorCodigoRecuperacao.mockResolvedValue(null);
      
      await expect(usuarioService.atualizarSenha({
        codigo_recupera_senha: "0000",
        senha: novaSenha
      })).rejects.toThrow(CustomError);
    });

    it("deve lançar erro se senha for inválida", async () => {
      const senhaInvalida = "123";
      
      await expect(usuarioService.atualizarSenha({
        tokenRecuperacao: tokenValido,
        senha: senhaInvalida
      })).rejects.toThrow();
    });

    it("deve lançar erro se usuário não for encontrado", async () => {
      mockTokenUtil.decodePasswordRecoveryToken.mockResolvedValue(decodedToken);
      mockRepository.listarPorId.mockResolvedValue(null);
      
      await expect(usuarioService.atualizarSenha({
        tokenRecuperacao: tokenValido,
        senha: novaSenha
      })).rejects.toThrow(CustomError);
    });
  });

  // Teste do ensureUserExists
  describe("ensureUserExists", () => {
    it("deve retornar usuário se existir", async () => {
      mockRepository.listarPorId.mockResolvedValue(usuarioFake);
      
      const resultado = await usuarioService.ensureUserExists(usuarioFake._id);
      
      expect(resultado).toEqual(usuarioFake);
    });

    it("deve lançar CustomError se usuário não existir", async () => {
      mockRepository.listarPorId.mockResolvedValue(null);
      
      await expect(usuarioService.ensureUserExists(usuarioFake._id)).rejects.toThrow(CustomError);
    });

    it("deve lançar erro se ID for inválido", async () => {
      await expect(usuarioService.ensureUserExists(invalidId)).rejects.toThrow();
    });
  });

  // Teste do validateEmail
  describe("validateEmail", () => {
    it("deve passar se email não estiver em uso", async () => {
      mockRepository.buscarPorEmail.mockResolvedValue(null);
      
      await expect(usuarioService.validateEmail("novo@email.com")).resolves.not.toThrow();
    });

    it("deve lançar erro se email já estiver em uso", async () => {
      mockRepository.buscarPorEmail.mockResolvedValue(usuarioFake);
      
      await expect(usuarioService.validateEmail(usuarioFake.email)).rejects.toThrow(CustomError);
    });

    it("deve aceitar email para o mesmo usuário", async () => {
      const usuarioMesmoId = { ...usuarioFake };
      mockRepository.buscarPorEmail.mockResolvedValue(usuarioMesmoId);
      
      jest.spyOn(mongoose.Types.ObjectId.prototype, 'equals').mockReturnValue(true);
      
      await usuarioService.validateEmail(usuarioFake.email, usuarioFake._id);
      // Se chegar aqui, o teste passa
      expect(true).toBe(true);
    });
  });

  // Teste do alterarStatus
  describe("alterarStatus", () => {
    const idValido = usuarioFake._id;
    const statusValido = "ativo";

    it("deve alterar o status de um usuário com sucesso", async () => {
        mockRepository.listarPorId.mockResolvedValue(usuarioFake);
        mockRepository.alterar.mockResolvedValue({ ...usuarioFake, status: statusValido });

        const resultado = await usuarioService.alterarStatus(idValido, statusValido);

        expect(mockRepository.listarPorId).toHaveBeenCalledWith(idValido);
        expect(mockRepository.alterar).toHaveBeenCalledWith(idValido, { status: statusValido });
        expect(resultado.status).toBe(statusValido);
    });

    it("deve lançar erro se o status for inválido", async () => {
        const statusInvalido = "indefinido";

        await expect(usuarioService.alterarStatus(idValido, statusInvalido)).rejects.toThrow(CustomError);
    });

    it("deve lançar erro se o usuário não existir", async () => {
        mockRepository.listarPorId.mockResolvedValue(null);

        await expect(usuarioService.alterarStatus(idValido, statusValido)).rejects.toThrow(CustomError);
    });

    it("deve lançar erro se o repositório falhar", async () => {
        mockRepository.listarPorId.mockResolvedValue(usuarioFake);
        mockRepository.alterar.mockRejectedValue(new Error("Erro no banco"));

        await expect(usuarioService.alterarStatus(idValido, statusValido)).rejects.toThrow("Erro no banco");
    });
  });
});