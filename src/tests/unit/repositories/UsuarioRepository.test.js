import mongoose from 'mongoose';
import UsuarioRepository from '../../../repositories/UsuarioRepository.js';

// mock dos helpers
jest.mock('../../../utils/helpers/index.js', () => ({
  CustomError: class extends Error {
    constructor({ statusCode, errorType, field, details, customMessage }) {
      super(customMessage);
      this.statusCode = statusCode;
      this.errorType = errorType;
      this.field = field;
      this.details = details;
    }
  },
  HttpStatusCodes: {
    NOT_FOUND: { code: 404, message: 'Recurso não encontrado' },
    INTERNAL_SERVER_ERROR: { code: 500, message: 'Erro interno do servidor' },
    BAD_REQUEST: { code: 400, message: 'Requisição com sintaxe incorreta' },
  },
  messages: {
    error: {
      internalServerError: (resource) => `Erro interno no ${resource}`,
      resourceNotFound: (resource) => `${resource} não encontrado`,
    },
  },
}));

const MockUsuarioModel = {
  save: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue(null),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  findByIdAndDelete: jest.fn(),
};


describe('UsuarioRepository', () => {
  let usuarioRepository;

  const mockUsuarioData = {
    _id: new mongoose.Types.ObjectId(),
    nome: 'Maria Souza',
    email: 'maria@email.com',
    senha: 'senha123',
    tokenUnico: 'token-unico',
    exp_tokenUnico_recuperacao: new Date(),
    refreshtoken: 'refresh-token',
    accesstoken: 'access-token'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    function UsuarioModel(data) {
      Object.assign(this, data);
      this.save = MockUsuarioModel.save;
    }
    usuarioRepository = new UsuarioRepository({
      usuarioModel: UsuarioModel,
    });
    // Para métodos estáticos
    usuarioRepository.model.find = MockUsuarioModel.find;
    usuarioRepository.model.findById = MockUsuarioModel.findById;
    usuarioRepository.model.findOne = MockUsuarioModel.findOne;
    usuarioRepository.model.findByIdAndUpdate = MockUsuarioModel.findByIdAndUpdate;
    usuarioRepository.model.findByIdAndDelete = MockUsuarioModel.findByIdAndDelete;
  });

  describe('cadastrar', () => {
    it('deve cadastrar um novo usuário com sucesso', async () => {
      MockUsuarioModel.save.mockResolvedValue(mockUsuarioData);
      const usuario = await usuarioRepository.cadastrar(mockUsuarioData);
      expect(MockUsuarioModel.save).toHaveBeenCalled();
      expect(usuario).toEqual(mockUsuarioData);
    });

    it('deve lançar erro ao cadastrar usuário inválido', async () => {
      MockUsuarioModel.save.mockImplementation(() => {
        throw new Error('Campo obrigatório ausente: email');
      });
      await expect(
        usuarioRepository.cadastrar({ ...mockUsuarioData, email: undefined })
      ).rejects.toThrow('Campo obrigatório ausente: email');
    });
  });

  describe('listar', () => {
    it('deve listar todos os usuários', async () => {
      MockUsuarioModel.find.mockResolvedValue([mockUsuarioData]);
      
      const usuarios = await usuarioRepository.listar();
      
      expect(MockUsuarioModel.find).toHaveBeenCalled();
      expect(usuarios).toEqual([mockUsuarioData]);
    });

    it('deve lançar erro ao listar usuários quando find falha', async () => {
      MockUsuarioModel.find.mockImplementation(() => {
        throw new Error('Erro no banco de dados ao listar');
      });
      await expect(usuarioRepository.listar()).rejects.toThrow('Erro no banco de dados ao listar');
    });
  });

  describe('listarPorId', () => {
    it('deve retornar usuário pelo ID', async () => {
      MockUsuarioModel.findById.mockResolvedValue(mockUsuarioData);
      
      const usuario = await usuarioRepository.listarPorId(mockUsuarioData._id);
      
      expect(MockUsuarioModel.findById).toHaveBeenCalledWith(mockUsuarioData._id);
      expect(usuario).toEqual(mockUsuarioData);
    });

    it('deve lançar erro se usuário não for encontrado', async () => {
      MockUsuarioModel.findById.mockResolvedValue(null);
      
      await expect(usuarioRepository.listarPorId(mockUsuarioData._id)).rejects.toThrow('Usuário não encontrado');
    });

    it('deve lançar erro ao listarPorId quando findById falha', async () => {
      MockUsuarioModel.findById.mockImplementation(() => {
        throw new Error('Erro no banco de dados ao buscar por ID');
      });
      await expect(usuarioRepository.listarPorId(mockUsuarioData._id)).rejects.toThrow(
        'Erro no banco de dados ao buscar por ID'
      );
    });

    it('deve retornar usuário pelo ID com includeTokens=true', async () => {
      // Para este teste, vamos simular o comportamento com select
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUsuarioData)
      };
      MockUsuarioModel.findById.mockReturnValue(mockQuery);
      
      const usuario = await usuarioRepository.listarPorId(mockUsuarioData._id, true);
      expect(MockUsuarioModel.findById).toHaveBeenCalledWith(mockUsuarioData._id);
      expect(mockQuery.select).toHaveBeenCalledWith('+refreshtoken +accesstoken');
      expect(usuario).toEqual(mockUsuarioData);
    });
  });

  describe('buscarPorEmail', () => {
    it('deve retornar usuário pelo email', async () => {
      MockUsuarioModel.findOne.mockResolvedValue(mockUsuarioData);
      const usuario = await usuarioRepository.buscarPorEmail(mockUsuarioData.email);
      expect(MockUsuarioModel.findOne).toHaveBeenCalled();
      expect(usuario).toEqual(mockUsuarioData);
    });

    it('deve buscar por email ignorando um id', async () => {
      MockUsuarioModel.findOne.mockResolvedValue(mockUsuarioData);
      await usuarioRepository.buscarPorEmail(mockUsuarioData.email, 'outro-id');
      expect(MockUsuarioModel.findOne).toHaveBeenCalledWith(
        { email: mockUsuarioData.email, _id: { $ne: 'outro-id' } },
        ['+senha', '+tokenUnico', '+exp_tokenUnico_recuperacao']
      );
    });

    it('deve retornar undefined se não encontrar usuário por email', async () => {
      MockUsuarioModel.findOne.mockResolvedValue(undefined);
      const usuario = await usuarioRepository.buscarPorEmail('naoexiste@email.com');
      expect(usuario).toBeUndefined();
    });

    it('deve lançar erro ao buscarPorEmail quando findOne falha', async () => {
      MockUsuarioModel.findOne.mockImplementation(() => {
        throw new Error('Erro no banco de dados ao buscar por email');
      });
      await expect(usuarioRepository.buscarPorEmail(mockUsuarioData.email)).rejects.toThrow(
        'Erro no banco de dados ao buscar por email'
      );
    });
  });

  describe('buscarPorTokenUnico', () => {
    it('deve retornar usuário pelo token único', async () => {
      MockUsuarioModel.findOne.mockResolvedValue(mockUsuarioData);
      const usuario = await usuarioRepository.buscarPorTokenUnico(mockUsuarioData.tokenUnico);
      expect(MockUsuarioModel.findOne).toHaveBeenCalled();
      expect(usuario).toEqual(mockUsuarioData);
    });

    it('deve retornar undefined se não encontrar usuário pelo token único', async () => {
      MockUsuarioModel.findOne.mockResolvedValue(undefined);
      const usuario = await usuarioRepository.buscarPorTokenUnico('token-invalido');
      expect(usuario).toBeUndefined();
    });

    it('deve lançar erro em caso de falha na busca por token único', async () => {
      MockUsuarioModel.findOne.mockImplementation(() => {
        throw new Error('Erro no banco de dados ao buscar por token único');
      });
      await expect(usuarioRepository.buscarPorTokenUnico('token')).rejects.toThrow(
        'Erro no banco de dados ao buscar por token único'
      );
    });
  });

  describe('alterar', () => {
    it('deve alterar campos do usuário com sucesso', async () => {
      const usuarioAtualizado = { ...mockUsuarioData, nome: 'Alterado' };
      MockUsuarioModel.findByIdAndUpdate.mockResolvedValue(usuarioAtualizado);
      
      const resultado = await usuarioRepository.alterar(mockUsuarioData._id, { nome: 'Alterado' });
      
      expect(MockUsuarioModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUsuarioData._id,
        { nome: 'Alterado' },
        { new: true }
      );
      expect(resultado.nome).toBe('Alterado');
    });

    it('deve alterar o status do usuário com sucesso', async () => {
      const usuarioAtualizado = { ...mockUsuarioData, status: 'inativo' };
      MockUsuarioModel.findByIdAndUpdate.mockResolvedValue(usuarioAtualizado);
      
      const resultado = await usuarioRepository.alterar(mockUsuarioData._id, { status: 'inativo' });
      
      expect(MockUsuarioModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUsuarioData._id,
        { status: 'inativo' },
        { new: true }
      );
      expect(resultado.status).toBe('inativo');
    });

    it('deve lançar erro ao tentar alterar usuário inexistente', async () => {
      MockUsuarioModel.findByIdAndUpdate.mockResolvedValue(null);
      
      await expect(usuarioRepository.alterar(mockUsuarioData._id, { nome: 'Alterado' })).rejects.toThrow(
        'Usuário não encontrado'
      );
    });

    it('deve lançar erro ao alterar usuário quando findByIdAndUpdate falha', async () => {
      MockUsuarioModel.findByIdAndUpdate.mockImplementation(() => {
        throw new Error('Erro no banco de dados ao alterar');
      });
      await expect(usuarioRepository.alterar(mockUsuarioData._id, { nome: 'Teste' })).rejects.toThrow(
        'Erro no banco de dados ao alterar'
      );
    });
  });

  describe('atualizarSenha', () => {
    it('deve atualizar a senha do usuário com sucesso', async () => {
      MockUsuarioModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUsuarioData),
      });
      const usuario = await usuarioRepository.atualizarSenha(mockUsuarioData._id, 'novaSenha123');
      expect(MockUsuarioModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUsuarioData._id,
        {
          $set: { senha: 'novaSenha123' },
          $unset: { tokenUnico: '', exp_tokenUnico_recuperacao: '' }
        },
        { new: true }
      );
      expect(usuario).toEqual(mockUsuarioData);
    });

    it('deve lançar erro se o usuário não for encontrado ao atualizar senha', async () => {
      MockUsuarioModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(usuarioRepository.atualizarSenha(mockUsuarioData._id, 'novaSenha123'))
        .rejects.toThrow('Usuário não encontrado');
    });

    it('deve lançar erro ao atualizar senha quando findByIdAndUpdate falha', async () => {
      MockUsuarioModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockImplementation(() => {
          throw new Error('Erro no banco de dados ao atualizar senha');
        }),
      });
      await expect(usuarioRepository.atualizarSenha(mockUsuarioData._id, 'novaSenha123'))
        .rejects.toThrow('Erro no banco de dados ao atualizar senha');
    });
  });

  describe('armazenarTokens', () => {
    it('deve armazenar accesstoken e refreshtoken com sucesso', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUsuarioData)
      });
      MockUsuarioModel.findByIdAndUpdate.mockReturnValue({
        select: mockSelect
      });

      const usuario = await usuarioRepository.armazenarTokens(
        mockUsuarioData._id, 
        'accesstoken123', 
        'refreshtoken123'
      );

      expect(MockUsuarioModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUsuarioData._id,
        {
          $set: { accesstoken: 'accesstoken123', refreshtoken: 'refreshtoken123' }
        },
        { new: true }
      );
      expect(mockSelect).toHaveBeenCalledWith('+accesstoken +refreshtoken');
      expect(usuario).toEqual(mockUsuarioData);
    });

    it('deve lançar erro ao armazenar tokens quando findByIdAndUpdate falha', async () => {
      MockUsuarioModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockImplementation(() => {
            throw new Error('Erro no banco de dados ao armazenar tokens');
          })
        })
      });

      await expect(usuarioRepository.armazenarTokens(
        mockUsuarioData._id, 
        'accesstoken123', 
        'refreshtoken123'
      )).rejects.toThrow('Erro no banco de dados ao armazenar tokens');
    });
  });

  describe('removeToken', () => {
    it('deve remover tokens do usuário com sucesso', async () => {
      MockUsuarioModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUsuarioData)
      });

      const usuario = await usuarioRepository.removeToken(mockUsuarioData._id);

      expect(MockUsuarioModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUsuarioData._id,
        {
          accesstoken: null,
          refreshtoken: null
        },
        { new: true }
      );
      expect(usuario).toEqual(mockUsuarioData);
    });

    it('deve lançar erro se o usuário não for encontrado ao remover tokens', async () => {
      MockUsuarioModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      await expect(usuarioRepository.removeToken(mockUsuarioData._id))
        .rejects.toThrow('Usuário não encontrado');
    });

    it('deve lançar erro ao remover tokens quando findByIdAndUpdate falha', async () => {
      MockUsuarioModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockImplementation(() => {
          throw new Error('Erro no banco de dados ao remover tokens');
        })
      });

      await expect(usuarioRepository.removeToken(mockUsuarioData._id))
        .rejects.toThrow('Erro no banco de dados ao remover tokens');
    });
  });
});