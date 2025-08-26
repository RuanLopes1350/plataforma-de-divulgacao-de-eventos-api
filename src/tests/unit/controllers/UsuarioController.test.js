// src/tests/unit/controllers/UsuarioController.test.js

// ==================================================================
// Mocks que precisam ser definidos ANTES de quaisquer outros imports
// ==================================================================

jest.mock('../../../utils/helpers/index.js', () => ({
    CommonResponse: {
        success: jest.fn().mockReturnThis(),
        created: jest.fn().mockReturnThis()
    },
    CustomError: function CustomError(opts) {
        this.message = opts.message;
        this.statusCode = opts.statusCode;
        Error.captureStackTrace(this, this.constructor);
    },
    HttpStatusCodes: {
        BAD_REQUEST: { code: 400 },
        NOT_FOUND: { code: 404 },
        INTERNAL_SERVER: { code: 500 }
    },
    errorHandler: jest.fn(),
    messages: {
        user: {
            notFound: () => 'Usuário não encontrado.'
        }
    },
    StatusService: {},
    asyncWrapper: jest.fn((fn) => fn)
}));

jest.mock('../../../utils/validators/schemas/zod/UsuarioSchema.js', () => {
    return {
        UsuarioSchema: { 
            parse: jest.fn(),
            safeParse: jest.fn() 
        },
        UsuarioUpdateSchema: { 
            parse: jest.fn(),
            safeParse: jest.fn() 
        }
    };
});

jest.mock('../../../utils/validators/schemas/zod/ObjectIdSchema.js', () => ({
    parse: jest.fn(),
    safeParse: jest.fn()
}));

// =================================================================
// Importação dos módulos que serão testados
// =================================================================
import mongoose from 'mongoose';

import UsuarioController from '../../../controllers/UsuarioController.js';
import UsuarioService from '../../../services/UsuarioService.js';

import { CommonResponse, CustomError, HttpStatusCodes } from '../../../utils/helpers/index.js';

import objectIdSchema from '../../../utils/validators/schemas/zod/ObjectIdSchema.js';
import { UsuarioSchema, UsuarioUpdateSchema } from '../../../utils/validators/schemas/zod/UsuarioSchema.js';

// =================================================================
// Testes para UsuarioController
// =================================================================
describe('UsuarioController', () => {
    let controller, req, res, next;

    beforeEach(() => {
        controller = new UsuarioController();
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        req = { 
            params: {}, 
            body: {}, 
            query: {},
            user: {} 
        };
        next = jest.fn();

        jest.clearAllMocks();
        controller.service = {
            cadastrar: jest.fn(),
            listar: jest.fn(),
            alterar: jest.fn(),
            deletar: jest.fn()
        };
    });

    // ================================
    // Testes para o método cadastrar
    // ================================
    describe('cadastrar', () => {
        const usuarioValido = {
            nome: 'Usuário Teste',
            email: 'teste@example.com',
            senha: 'Senha123@',
        };

        const usuarioCadastrado = {
            ...usuarioValido,
            _id: new mongoose.Types.ObjectId(),
            toObject: jest.fn(() => ({
                ...usuarioValido,
                _id: new mongoose.Types.ObjectId(),
                senha: undefined
            }))
        };

        beforeEach(() => {
            req.body = usuarioValido;
            UsuarioSchema.parse.mockReturnValue(usuarioValido);
            controller.service.cadastrar.mockResolvedValue(usuarioCadastrado);
        });

        it('deve cadastrar um usuário com sucesso e remover a senha da resposta', async () => {
            await controller.cadastrar(req, res);

            expect(UsuarioSchema.parse).toHaveBeenCalledWith(usuarioValido);
            expect(controller.service.cadastrar).toHaveBeenCalledWith(usuarioValido);
            expect(usuarioCadastrado.toObject).toHaveBeenCalled();
            expect(CommonResponse.created).toHaveBeenCalledWith(
                res,
                expect.not.objectContaining({ senha: expect.anything() })
            );
        });

        it('deve lançar erro se validação do schema falhar', async () => {
            const erroValidacao = new Error('Dados inválidos');
            UsuarioSchema.parse.mockImplementation(() => {
                throw erroValidacao;
            });

            await expect(controller.cadastrar(req, res)).rejects.toThrow(erroValidacao);
        });

        it('deve lançar erro se serviço falhar', async () => {
            const erroServico = new Error('Erro no serviço');
            controller.service.cadastrar.mockRejectedValue(erroServico);

            await expect(controller.cadastrar(req, res)).rejects.toThrow(erroServico);
        });
    });

    // ==========================================
    // Testes para o método cadastrarComSenha (usado pela rota signup de auth)
    // ==========================================
    describe('cadastrarComSenha', () => {
        const usuarioValido = {
            nome: 'Usuário Teste',
            email: 'teste@example.com',
            senha: 'Senha123@',
        };

        const usuarioCadastrado = {
            ...usuarioValido,
            _id: new mongoose.Types.ObjectId(),
            toObject: jest.fn(() => ({
                ...usuarioValido,
                _id: new mongoose.Types.ObjectId()
            }))
        };

        beforeEach(() => {
            req.body = usuarioValido;
            UsuarioSchema.parse.mockReturnValue(usuarioValido);
            controller.service.cadastrar.mockResolvedValue(usuarioCadastrado);
        });

        it('deve cadastrar um usuário com sucesso através da rota signup MANTENDO a senha na resposta', async () => {
            await controller.cadastrarComSenha(req, res);

            expect(UsuarioSchema.parse).toHaveBeenCalledWith(usuarioValido);
            expect(controller.service.cadastrar).toHaveBeenCalledWith(usuarioValido);
            expect(usuarioCadastrado.toObject).toHaveBeenCalled();
            expect(CommonResponse.created).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    nome: usuarioValido.nome,
                    email: usuarioValido.email,
                    senha: usuarioValido.senha // A diferença é que mantém a senha
                })
            );
        });

        it('deve lançar erro se validação do schema falhar no cadastrarComSenha', async () => {
            const erroValidacao = new Error('Dados inválidos para signup');
            UsuarioSchema.parse.mockImplementation(() => {
                throw erroValidacao;
            });

            await expect(controller.cadastrarComSenha(req, res)).rejects.toThrow(erroValidacao);
        });

        it('deve lançar erro se serviço falhar no cadastrarComSenha', async () => {
            const erroServico = new Error('Erro no serviço durante signup');
            controller.service.cadastrar.mockRejectedValue(erroServico);

            await expect(controller.cadastrarComSenha(req, res)).rejects.toThrow(erroServico);
        });

        it('deve lidar com objeto de usuário sem método toObject no cadastrarComSenha', async () => {
            const usuarioSemToObject = { 
                _id: '123', 
                nome: 'Teste',
                email: 'teste@test.com',
                senha: 'senha123'
            };
            UsuarioSchema.parse.mockReturnValue(usuarioSemToObject);
            controller.service.cadastrar.mockResolvedValue(usuarioSemToObject);

            await controller.cadastrarComSenha(req, res);

            expect(CommonResponse.created).toHaveBeenCalledWith(
                res,
                usuarioSemToObject
            );
        });

        it('deve usar UsuarioSchema para validação no cadastrarComSenha', async () => {
            const dadosCompletos = {
                nome: 'João Silva',
                email: 'joao@exemplo.com',
                senha: 'MinhaSenh@123',
            };

            req.body = dadosCompletos;
            UsuarioSchema.parse.mockReturnValue(dadosCompletos);

            await controller.cadastrarComSenha(req, res);

            expect(UsuarioSchema.parse).toHaveBeenCalledWith(dadosCompletos);
            expect(controller.service.cadastrar).toHaveBeenCalledWith(dadosCompletos);
        });
    });

    // ==============================================
    // Testes para o método listar
    // ==============================================
    describe('listar', () => {
        const usuarioMock = {
            _id: new mongoose.Types.ObjectId(),
            nome: 'Usuário Teste',
            email: 'teste@example.com'
        };

        const listaUsuariosMock = [usuarioMock];

        it('deve listar todos os usuários quando não há ID', async () => {
            req.params.id = undefined;
            controller.service.listar.mockResolvedValue(listaUsuariosMock);

            await controller.listar(req, res);

            expect(controller.service.listar).toHaveBeenCalledWith(req);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, listaUsuariosMock);
        });

        it('deve listar um usuário específico quando ID é fornecido', async () => {
            req.params.id = usuarioMock._id.toString();
            objectIdSchema.parse.mockReturnValue(true);
            controller.service.listar.mockResolvedValue(usuarioMock);

            await controller.listar(req, res);

            expect(objectIdSchema.parse).toHaveBeenCalledWith(usuarioMock._id.toString());
            expect(controller.service.listar).toHaveBeenCalledWith(usuarioMock._id.toString());
            expect(CommonResponse.success).toHaveBeenCalledWith(res, usuarioMock);
        });

        it('deve lançar erro se ID for inválido', async () => {
            req.params.id = 'id-invalido';
            const erroValidacao = new Error('ID inválido');
            objectIdSchema.parse.mockImplementation(() => {
                throw erroValidacao;
            });

            await expect(controller.listar(req, res)).rejects.toThrow(erroValidacao);
        });

        it('deve lançar CustomError se usuário não for encontrado', async () => {
            req.params.id = 'id-inexistente';
            objectIdSchema.parse.mockReturnValue(true);
            controller.service.listar = jest.fn().mockResolvedValue(null);

            await expect(controller.listar(req, res)).rejects.toMatchObject({
                message: 'Usuário não encontrado.',
                statusCode: 404
            });
        });

        it('deve lançar erro se serviço falhar', async () => {
            req.params.id = undefined;
            const erroServico = new Error('Erro no serviço');
            controller.service.listar.mockRejectedValue(erroServico);

            await expect(controller.listar(req, res)).rejects.toThrow(erroServico);
        });
    });

    // ================================
    // Testes para o método alterar
    // ================================
    describe('alterar', () => {
        const idValido = new mongoose.Types.ObjectId().toString();
        const dadosAtualizacao = { nome: 'Novo Nome' };
        const usuarioAtualizado = {
            _id: idValido,
            nome: 'Novo Nome',
            email: 'teste@example.com',
            toObject: jest.fn(() => ({
                _id: idValido,
                nome: 'Novo Nome',
                email: 'teste@example.com',
                senha: undefined
            }))
        };

        beforeEach(() => {
            req.params.id = idValido;
            req.body = dadosAtualizacao;
            objectIdSchema.parse.mockReturnValue(true);
            UsuarioUpdateSchema.parse.mockReturnValue(dadosAtualizacao);
            controller.service.alterar.mockResolvedValue(usuarioAtualizado);
        });

        it('deve atualizar um usuário com sucesso e remover a senha da resposta', async () => {
            await controller.alterar(req, res);

            expect(objectIdSchema.parse).toHaveBeenCalledWith(idValido);
            expect(UsuarioUpdateSchema.parse).toHaveBeenCalledWith(dadosAtualizacao);
            expect(controller.service.alterar).toHaveBeenCalledWith(idValido, dadosAtualizacao);
            expect(usuarioAtualizado.toObject).toHaveBeenCalled();
            expect(CommonResponse.success).toHaveBeenCalledWith(
                res,
                expect.not.objectContaining({ senha: expect.anything() }),
                200,
                'Usuário atualizado com sucesso.'
            );
        });

        it('deve lançar erro se ID for inválido', async () => {
            const erroValidacao = new Error('ID inválido');
            objectIdSchema.parse.mockImplementation(() => {
                throw erroValidacao;
            });

            await expect(controller.alterar(req, res)).rejects.toThrow(erroValidacao);
        });

        it('deve lançar erro se validação do schema falhar', async () => {
            const erroValidacao = new Error('Dados inválidos');
            UsuarioUpdateSchema.parse.mockImplementation(() => {
                throw erroValidacao;
            });

            await expect(controller.alterar(req, res)).rejects.toThrow(erroValidacao);
        });

        it('deve lançar erro se serviço falhar', async () => {
            const erroServico = new Error('Erro no serviço');
            controller.service.alterar.mockRejectedValue(erroServico);

            await expect(controller.alterar(req, res)).rejects.toThrow(erroServico);
        });
    });


    // ================================
    // Testes para o método alterarStatus
    // ================================
    describe('alterarStatus', () => {
        const idValido = new mongoose.Types.ObjectId().toString();
        const statusValido = 'ativo';
        const usuarioAtualizado = {
            _id: idValido,
            nome: 'Usuário Teste',
            email: 'teste@example.com',
            status: statusValido
        };

        beforeEach(() => {
            req.params.id = idValido;
            req.body = { status: statusValido };
            objectIdSchema.parse.mockReturnValue(true);
            controller.service.alterarStatus = jest.fn().mockResolvedValue(usuarioAtualizado);
        });

        it('deve atualizar o status de um usuário com sucesso', async () => {
            await controller.alterarStatus(req, res);

            expect(objectIdSchema.parse).toHaveBeenCalledWith(idValido);
            expect(controller.service.alterarStatus).toHaveBeenCalledWith(idValido, statusValido);
            expect(CommonResponse.success).toHaveBeenCalledWith(
                res,
                usuarioAtualizado,
                200,
                `Status do usuário atualizado para ${statusValido}.`
            );
        });

        it('deve lançar erro se ID for inválido', async () => {
            const erroValidacao = new Error('ID inválido');
            objectIdSchema.parse.mockImplementation(() => {
                throw erroValidacao;
            });

            await expect(controller.alterarStatus(req, res)).rejects.toThrow(erroValidacao);
        });

        it('deve lançar erro se status for inválido', async () => {
            req.body.status = 'status-invalido';
            const erroValidacao = new Error('Status inválido');
            controller.service.alterarStatus.mockImplementation(() => {
                throw erroValidacao;
            });

            await expect(controller.alterarStatus(req, res)).rejects.toThrow(erroValidacao);
        });

        it('deve lançar erro se serviço falhar', async () => {
            const erroServico = new Error('Erro no serviço');
            controller.service.alterarStatus.mockRejectedValue(erroServico);

            await expect(controller.alterarStatus(req, res)).rejects.toThrow(erroServico);
        });
    });

    // ================================
    // Testes para casos extremos
    // ================================
    describe('Casos extremos', () => {
        it('deve lidar com erro inesperado no cadastrar', async () => {
            req.body = {};
            const erroInesperado = new Error('Erro inesperado');
            UsuarioSchema.parse.mockImplementation(() => {
                throw erroInesperado;
            });

            await expect(controller.cadastrar(req, res)).rejects.toThrow(erroInesperado);
        });

        it('deve lidar com objeto de usuário sem método toObject no cadastrar', async () => {
            const usuarioSemToObject = { _id: '123', nome: 'Teste' };
            UsuarioSchema.parse.mockReturnValue(usuarioSemToObject);
            controller.service.cadastrar.mockResolvedValue(usuarioSemToObject);

            await controller.cadastrar(req, res);

            expect(CommonResponse.created).toHaveBeenCalledWith(
                res,
                usuarioSemToObject
            );
        });
    });
});