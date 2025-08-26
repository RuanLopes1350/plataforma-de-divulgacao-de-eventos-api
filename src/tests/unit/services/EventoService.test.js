// src/tests/unit/services/EventoService.test.js

import EventoService from "../../../services/EventoService.js";
import mongoose from "mongoose";
import { CustomError } from "../../../utils/helpers/index.js";

// Mock do repositório para simular o banco
const mockRepository = {
  cadastrar: jest.fn(),
  listar: jest.fn(),
  listarPorId: jest.fn(),
  alterar: jest.fn(),
  alterarStatus: jest.fn(),
  deletar: jest.fn(),
  model: {
    updateOne: jest.fn()
  }
};

const mockUsuarioRepository = {
  buscarPorEmail: jest.fn()
};

const eventoService = new EventoService();
eventoService.repository = mockRepository;
eventoService.usuarioRepository = mockUsuarioRepository;

// Mock dos métodos auxiliares
eventoService.ensureEventExists = jest.fn();
eventoService.ensureUserIsOwner = jest.fn();
eventoService.validarMidiasObrigatorias = jest.fn();

const invalidId = "invalid";

const mockUsuario = {
    _id: '6653d0b8e7b98e0014e6f009',
    nome: 'João da Silva',
};

const eventoFake = {
    _id: new mongoose.Types.ObjectId().toString(),
    titulo: "Semana de Inovação Tecnológica",
    descricao: "Uma semana dedicada a palestras e workshops sobre inovação tecnológica.",
    local: "Auditório Principal",
    dataEvento: new Date("2025-05-25"),
    organizador: {
      _id: mockUsuario._id,
      nome: mockUsuario.nome,
    },
    linkInscricao: "https://forms.gle/exemplo",
    eventoCriadoEm: new Date(),
    tags: ["Tecnologia", "Inovação"],
    categoria: "Tecnologia",
    status: "ativo",
    midiaVideo: [
      {
        _id: new mongoose.Types.ObjectId(),
        url: "/uploads/video/videoApresentativo.mp4",
        tamanhoMb: 12.3,
        altura: 720,
        largura: 1280,
      },
    ],
    midiaCapa: [
      {
        _id: new mongoose.Types.ObjectId(),
        url: "/uploads/capa/capaEvento.jpg",
        tamanhoMb: 2.5,
        altura: 720,
        largura: 1280,
      },
    ],
    midiaCarrossel: [
      {
        _id: new mongoose.Types.ObjectId(),
        url: "/uploads/carrossel/carrosselEvento1.jpg",
        tamanhoMb: 1.5,
        altura: 768,
        largura: 1024,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        url: "/uploads/carrossel/carrosselEvento2.jpg",
        tamanhoMb: 1.8,
        altura: 768,
        largura: 1024,
      },
    ],
  };

describe("EventoService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsuarioRepository.buscarPorEmail.mockClear();
    mockRepository.model.updateOne.mockClear();
  });


  //Teste do cadastrar
  describe("Cadastrar", () => {
    it("deve cadastrar um novo evento com sucesso", async () => {
      mockRepository.cadastrar.mockResolvedValue(eventoFake);
      const resultado = await eventoService.cadastrar(eventoFake);
      expect(resultado).toEqual(eventoFake);
      expect(mockRepository.cadastrar).toHaveBeenCalledWith(eventoFake);
    });

    it("deve lançar erro se o repositório falhar", async () => {
      mockRepository.cadastrar.mockRejectedValue(new Error("Falha ao cadastrar"));
      await expect(eventoService.cadastrar(eventoFake)).rejects.toThrow("Falha ao cadastrar");
    });
  });

  // Teste de listar
  describe("Listar e Listar por ID", () => {
    it("deve retornar lista de eventos quando chamada sem parâmetro", async () => {
      const mockReq = { query: {}, user: { _id: mockUsuario._id } };
      mockRepository.listar.mockResolvedValue([eventoFake]);
      
      const resultado = await eventoService.listar(mockReq);
      expect(resultado).toEqual([eventoFake]);
      expect(mockRepository.listar).toHaveBeenCalledWith(mockReq);
    });

    it("deve retornar um evento pelo ID válido", async () => {
      const mockReq = { params: { id: eventoFake._id } };
      mockRepository.listar.mockResolvedValue(eventoFake);
      
      const resultado = await eventoService.listar(eventoFake._id, mockUsuario._id);
      expect(resultado).toEqual(eventoFake);
      expect(mockRepository.listar).toHaveBeenCalledWith(mockReq);
    });

    it("deve lançar erro se ID for inválido (objectIdSchema)", async () => {
      await expect(eventoService.listar(invalidId, mockUsuario._id)).rejects.toThrow();
    });

    it("deve lançar erro se evento não for encontrado para usuário não autenticado", async () => {
      const eventoInativo = { ...eventoFake, status: 'inativo' };
      const mockReq = { params: { id: eventoFake._id } };
      mockRepository.listar.mockResolvedValue(eventoInativo);
      
      await expect(eventoService.listar(eventoFake._id)).rejects.toThrow('Evento não encontrado ou inativo');
    });

    it("deve lançar erro se listar falhar", async () => {
      const mockReq = { query: {}, user: { _id: mockUsuario._id } };
      mockRepository.listar.mockRejectedValue(new Error("Erro no banco"));
      
      await expect(eventoService.listar(mockReq)).rejects.toThrow("Erro no banco");
    });
  });


  // Teste do alterar
  describe("Alterar", () => {
    const dadosAtualizados = { titulo: "Novo Título" };

    it("deve atualizar evento existente com sucesso", async () => {
      eventoService.ensureEventExists.mockResolvedValue(eventoFake);
      eventoService.ensureUserIsOwner.mockResolvedValue();
      mockRepository.alterar.mockResolvedValue({ ...eventoFake, ...dadosAtualizados });
      
      const resultado = await eventoService.alterar(eventoFake._id, dadosAtualizados, mockUsuario._id);
      expect(resultado.titulo).toBe("Novo Título");
      expect(eventoService.ensureEventExists).toHaveBeenCalledWith(eventoFake._id);
      expect(eventoService.ensureUserIsOwner).toHaveBeenCalledWith(eventoFake, mockUsuario._id, false);
      expect(mockRepository.alterar).toHaveBeenCalledWith(eventoFake._id, dadosAtualizados);
    });

    it("deve lançar CustomError se evento não existir", async () => {
      eventoService.ensureEventExists.mockRejectedValue(new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Evento',
        details: [],
        customMessage: 'Evento não encontrado'
      }));
      
      await expect(eventoService.alterar(eventoFake._id, dadosAtualizados, mockUsuario._id)).rejects.toThrow(CustomError);
    });

    it("deve lançar erro se ID for inválido", async () => {
      await expect(eventoService.alterar(invalidId, dadosAtualizados, mockUsuario._id)).rejects.toThrow();
    });

    it("deve lançar erro se alterar falhar", async () => {
      eventoService.ensureEventExists.mockResolvedValue(eventoFake);
      eventoService.ensureUserIsOwner.mockResolvedValue();
      mockRepository.alterar.mockRejectedValue(new Error("Erro no banco"));
      
      await expect(eventoService.alterar(eventoFake._id, dadosAtualizados, mockUsuario._id)).rejects.toThrow("Erro no banco");
    });
  });


  // Teste do alterarStatus
  describe("Alterar Status", () => {
    const novoStatus = "inativo";

    it("deve alterar status do evento com sucesso", async () => {
      eventoService.ensureEventExists.mockResolvedValue(eventoFake);
      eventoService.ensureUserIsOwner.mockResolvedValue();
      mockRepository.alterarStatus.mockResolvedValue({ ...eventoFake, status: novoStatus });
      
      const resultado = await eventoService.alterarStatus(eventoFake._id, novoStatus, mockUsuario._id);
      expect(resultado.status).toBe(novoStatus);
      expect(eventoService.ensureEventExists).toHaveBeenCalledWith(eventoFake._id);
      expect(eventoService.ensureUserIsOwner).toHaveBeenCalledWith(eventoFake, mockUsuario._id, true);
      expect(mockRepository.alterarStatus).toHaveBeenCalledWith(eventoFake._id, novoStatus);
    });

    it("deve lançar CustomError se evento não existir", async () => {
      eventoService.ensureEventExists.mockRejectedValue(new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Evento',
        details: [],
        customMessage: 'Evento não encontrado'
      }));
      
      await expect(eventoService.alterarStatus(eventoFake._id, novoStatus, mockUsuario._id)).rejects.toThrow(CustomError);
    });

    it("deve lançar erro se ID for inválido", async () => {
      await expect(eventoService.alterarStatus(invalidId, novoStatus, mockUsuario._id)).rejects.toThrow();
    });

    it("deve lançar erro se alterarStatus falhar", async () => {
      eventoService.ensureEventExists.mockResolvedValue(eventoFake);
      eventoService.ensureUserIsOwner.mockResolvedValue();
      mockRepository.alterarStatus.mockRejectedValue(new Error("Erro no banco"));
      
      await expect(eventoService.alterarStatus(eventoFake._id, novoStatus, mockUsuario._id)).rejects.toThrow("Erro no banco");
    });
  });


  // Teste do deletar
  describe("Deletar", () => {
    it("deve deletar evento com sucesso", async () => {
      eventoService.ensureEventExists.mockResolvedValue(eventoFake);
      eventoService.ensureUserIsOwner.mockResolvedValue();
      mockRepository.deletar.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
      
      const resultado = await eventoService.deletar(eventoFake._id, mockUsuario._id);
      expect(resultado).toEqual({ acknowledged: true, deletedCount: 1 });
      expect(eventoService.ensureEventExists).toHaveBeenCalledWith(eventoFake._id);
      expect(eventoService.ensureUserIsOwner).toHaveBeenCalledWith(eventoFake, mockUsuario._id, true);
      expect(mockRepository.deletar).toHaveBeenCalledWith(eventoFake._id);
    });

    it("deve lançar CustomError se evento não existir", async () => {
      eventoService.ensureEventExists.mockRejectedValue(new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Evento',
        details: [],
        customMessage: 'Evento não encontrado'
      }));
      
      await expect(eventoService.deletar(eventoFake._id, mockUsuario._id)).rejects.toThrow(CustomError);
    });

    it("deve lançar erro se ID for inválido", async () => {
      await expect(eventoService.deletar(invalidId, mockUsuario._id)).rejects.toThrow();
    });

    it("deve lançar erro se deletar falhar", async () => {
      eventoService.ensureEventExists.mockResolvedValue(eventoFake);
      eventoService.ensureUserIsOwner.mockResolvedValue();
      mockRepository.deletar.mockRejectedValue(new Error("Erro no banco"));
      
      await expect(eventoService.deletar(eventoFake._id, mockUsuario._id)).rejects.toThrow("Erro no banco");
    });
  });

  // =====================================================
  // Testes para o método compartilharPermissao
  // =====================================================
  describe('compartilharPermissao', () => {
    const usuarioDestino = {
      _id: new mongoose.Types.ObjectId().toString(),
      email: 'destino@example.com',
      nome: 'Usuario Destino'
    };

    beforeEach(() => {
      // Reset para usar os métodos reais nos testes auxiliares
      eventoService.ensureEventExists = EventoService.prototype.ensureEventExists;
      eventoService.ensureUserIsOwner = EventoService.prototype.ensureUserIsOwner;
    });

    it('deve compartilhar permissão com sucesso', async () => {
      const eventoComPermissoes = { ...eventoFake, permissoes: [] };
      
      mockRepository.listarPorId.mockResolvedValue(eventoComPermissoes);
      mockUsuarioRepository.buscarPorEmail.mockResolvedValue(usuarioDestino);
      mockRepository.model.updateOne.mockResolvedValue({ acknowledged: true });
      mockRepository.listarPorId.mockResolvedValueOnce(eventoComPermissoes);

      const result = await eventoService.compartilharPermissao(
        eventoFake._id,
        usuarioDestino.email,
        'editar',
        '2024-12-31T23:59:59.999Z',
        mockUsuario._id
      );

      expect(mockUsuarioRepository.buscarPorEmail).toHaveBeenCalledWith(usuarioDestino.email);
      expect(mockRepository.model.updateOne).toHaveBeenCalled();
      expect(result).toEqual(eventoComPermissoes);
    });

    it('deve lançar erro se usuário destinatário não for encontrado', async () => {
      mockRepository.listarPorId.mockResolvedValue(eventoFake);
      mockUsuarioRepository.buscarPorEmail.mockResolvedValue(null);

      await expect(eventoService.compartilharPermissao(
        eventoFake._id,
        'naoexiste@example.com',
        'editar',
        '2024-12-31T23:59:59.999Z',
        mockUsuario._id
      )).rejects.toThrow('Usuário com email naoexiste@example.com não encontrado.');
    });

    it('deve lançar erro se usuário tentar compartilhar consigo mesmo', async () => {
      const usuarioComMesmoId = { ...usuarioDestino, _id: mockUsuario._id };
      
      mockRepository.listarPorId.mockResolvedValue(eventoFake);
      mockUsuarioRepository.buscarPorEmail.mockResolvedValue(usuarioComMesmoId);

      await expect(eventoService.compartilharPermissao(
        eventoFake._id,
        usuarioDestino.email,
        'editar',
        '2024-12-31T23:59:59.999Z',
        mockUsuario._id
      )).rejects.toThrow('Você não pode compartilhar o evento consigo mesmo.');
    });

    it('deve lançar erro se usuário já possui permissão ativa', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const eventoComPermissaoAtiva = {
        ...eventoFake,
        permissoes: [{
          usuario: usuarioDestino._id,
          permissao: 'editar',
          expiraEm: futureDate.toISOString()
        }]
      };
      
      mockRepository.listarPorId.mockResolvedValue(eventoComPermissaoAtiva);
      mockUsuarioRepository.buscarPorEmail.mockResolvedValue(usuarioDestino);

      await expect(eventoService.compartilharPermissao(
        eventoFake._id,
        usuarioDestino.email,
        'editar',
        '2024-12-31T23:59:59.999Z',
        mockUsuario._id
      )).rejects.toThrow(`Usuário ${usuarioDestino.email} já possui permissão ativa para este evento.`);
    });
  });

  // =====================================================
  // Testes para métodos auxiliares
  // =====================================================
  describe('Métodos auxiliares', () => {
    beforeEach(() => {
      // Reset para usar os métodos reais
      eventoService.ensureEventExists = EventoService.prototype.ensureEventExists;
      eventoService.ensureUserIsOwner = EventoService.prototype.ensureUserIsOwner;
      eventoService.validarMidiasObrigatorias = EventoService.prototype.validarMidiasObrigatorias;
    });

    describe('ensureEventExists', () => {
      it('deve retornar evento se existir', async () => {
        mockRepository.listarPorId.mockResolvedValue(eventoFake);

        const result = await eventoService.ensureEventExists(eventoFake._id);

        expect(result).toEqual(eventoFake);
        expect(mockRepository.listarPorId).toHaveBeenCalledWith(eventoFake._id);
      });

      it('deve lançar erro se evento não existir', async () => {
        mockRepository.listarPorId.mockResolvedValue(null);

        await expect(eventoService.ensureEventExists(eventoFake._id)).rejects.toThrow(CustomError);
      });

      it('deve lançar erro se ID for inválido', async () => {
        await expect(eventoService.ensureEventExists(invalidId)).rejects.toThrow();
      });
    });

    describe('ensureUserIsOwner', () => {
      it('deve permitir acesso ao proprietário do evento', async () => {
        await expect(
          eventoService.ensureUserIsOwner(eventoFake, mockUsuario._id)
        ).resolves.not.toThrow();
      });

      it('deve permitir acesso a usuário com permissão compartilhada válida', async () => {
        const outroUsuarioId = new mongoose.Types.ObjectId().toString();
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        const eventoComPermissao = {
          ...eventoFake,
          permissoes: [{
            usuario: outroUsuarioId,
            permissao: 'editar',
            expiraEm: futureDate.toISOString()
          }]
        };

        await expect(
          eventoService.ensureUserIsOwner(eventoComPermissao, outroUsuarioId, false)
        ).resolves.not.toThrow();
      });

      it('deve bloquear acesso quando ownerOnly=true e usuário não é proprietário', async () => {
        const outroUsuarioId = new mongoose.Types.ObjectId().toString();

        await expect(
          eventoService.ensureUserIsOwner(eventoFake, outroUsuarioId, true)
        ).rejects.toThrow('Apenas o proprietário do evento pode realizar esta operação.');
      });

      it('deve bloquear acesso para usuário sem permissão', async () => {
        const outroUsuarioId = new mongoose.Types.ObjectId().toString();

        await expect(
          eventoService.ensureUserIsOwner(eventoFake, outroUsuarioId, false)
        ).rejects.toThrow('Você não tem permissão para manipular este evento.');
      });

      it('deve bloquear acesso para usuário com permissão expirada', async () => {
        const outroUsuarioId = new mongoose.Types.ObjectId().toString();
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);
        
        const eventoComPermissaoExpirada = {
          ...eventoFake,
          permissoes: [{
            usuario: outroUsuarioId,
            permissao: 'editar',
            expiraEm: pastDate.toISOString()
          }]
        };

        await expect(
          eventoService.ensureUserIsOwner(eventoComPermissaoExpirada, outroUsuarioId, false)
        ).rejects.toThrow('Você não tem permissão para manipular este evento.');
      });
    });

    describe('validarMidiasObrigatorias', () => {
      it('deve passar validação quando todas as mídias estão presentes', async () => {
        await expect(
          eventoService.validarMidiasObrigatorias(eventoFake)
        ).resolves.not.toThrow();
      });

      it('deve lançar erro quando vídeo está ausente', async () => {
        const eventoSemVideo = { ...eventoFake, midiaVideo: [] };

        await expect(
          eventoService.validarMidiasObrigatorias(eventoSemVideo)
        ).rejects.toThrow('Vídeo é obrigatório');
      });

      it('deve lançar erro quando capa está ausente', async () => {
        const eventoSemCapa = { ...eventoFake, midiaCapa: [] };

        await expect(
          eventoService.validarMidiasObrigatorias(eventoSemCapa)
        ).rejects.toThrow('Capa é obrigatória');
      });

      it('deve lançar erro quando carrossel está ausente', async () => {
        const eventoSemCarrossel = { ...eventoFake, midiaCarrossel: [] };

        await expect(
          eventoService.validarMidiasObrigatorias(eventoSemCarrossel)
        ).rejects.toThrow('Carrossel é obrigatório');
      });

      it('deve lançar erro com todas as mídias ausentes', async () => {
        const eventoSemMidias = { 
          ...eventoFake, 
          midiaVideo: [], 
          midiaCapa: [], 
          midiaCarrossel: [] 
        };

        await expect(
          eventoService.validarMidiasObrigatorias(eventoSemMidias)
        ).rejects.toThrow('Vídeo é obrigatório, Capa é obrigatória, Carrossel é obrigatório');
      });
    });
  });
});