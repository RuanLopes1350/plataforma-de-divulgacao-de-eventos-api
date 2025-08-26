// src/tests/unit/controllers/EventoController.test.js

// ==================================================================
// Mocks que precisam ser definidos ANTES de quaisquer outros imports
// ==================================================================

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'fixed-uuid')
}));

jest.mock('../../../utils/helpers/index.js', () => {
    return {
        CommonResponse: {
            success: jest.fn(),
            created: jest.fn()
        },
        CustomError: jest.fn((opts) => {
            const err = new Error(opts.customMessage || opts);
            err.statusCode = opts.statusCode;
            err.errorType = opts.errorType;
            err.field = opts.field;
            err.details = opts.details;
            return err;
        }),
        HttpStatusCodes: {
            BAD_REQUEST: { code: 400 },
            NOT_FOUND: { code: 404 }
        },
        errorHandler: jest.fn(),
        messages: {
            error: {
                resourceNotFound: (resource) => `${resource} não encontrado`
            },
            validation: {
                generic: {
                    resourceDeleted: (resource) => `${resource} excluído(a) com sucesso.`
                }
            },
            event: {
                notFound: "Evento não encontrado."
            }
        },
        StatusService: {},
        asyncWrapper: jest.fn()
    };
});

jest.mock('../../../utils/validators/schemas/zod/EventoSchema.js', () => {
    return {
        EventoSchema: { parse: jest.fn(), safeParse: jest.fn() },
        EventoUpdateSchema: { parse: jest.fn() }
    };
});

jest.mock('../../../utils/validators/schemas/zod/querys/EventoQuerySchema.js', () => {
    return {
        EventoQuerySchema: { parseAsync: jest.fn() }
    };
});

jest.mock('qrcode', () => ({
    toDataURL: jest.fn()
}));
  
// =================================================================
// Importação dos módulos que serão testados
// =================================================================
import mongoose from 'mongoose';

import EventoController from '../../../controllers/EventoController.js';
import EventoService from '../../../services/EventoService.js';
import QRCode from 'qrcode';

import { CommonResponse, CustomError, HttpStatusCodes } from '../../../utils/helpers/index.js';

import objectIdSchema from '../../../utils/validators/schemas/zod/ObjectIdSchema.js';
import { EventoSchema, EventoUpdateSchema } from '../../../utils/validators/schemas/zod/EventoSchema.js';
import { EventoQuerySchema } from '../../../utils/validators/schemas/zod/querys/EventoQuerySchema.js';

// =================================================================
// Testes para EventoController
// =================================================================
describe('EventoController', () => {
    let controller, req, res, next;

    beforeEach(() => {
        controller = new EventoController();
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            setHeader: jest.fn(),
            sendFile: jest.fn()
        };
        req = { params: {}, body: {}, files: {} };
        next = jest.fn();

        CommonResponse.success.mockClear();
        CommonResponse.created.mockClear();
        EventoSchema.parse.mockClear();
        EventoSchema.safeParse.mockClear();
        EventoUpdateSchema.parse.mockClear();
        EventoQuerySchema.parseAsync.mockClear();
        QRCode.toDataURL.mockClear();

        controller.service.cadastrar = jest.fn();
        controller.service.listar = jest.fn();
        controller.service.alterar = jest.fn();
        controller.service.alterarStatus = jest.fn();
        controller.service.deletar = jest.fn();
        controller.service.ensureEventExists = jest.fn();
        controller.service.ensureUserIsOwner = jest.fn();
        controller.service.validarMidiasObrigatorias = jest.fn();
        controller.service.compartilharPermissao = jest.fn();
        controller.uploadService.limparArquivosProcessados = jest.fn();
        controller.uploadService.processarArquivosParaCadastro = jest.fn();
    });

    
    // ================================
    // Testes para o método cadastrar
    // ================================
    describe('cadastrar', () => {
        it('deve cadastrar um evento com sucesso', async () => {
          req.body = { titulo: 'Evento Teste' };
          req.user = {
            _id: "682520e98e38a409ac2ac569",
            nome: "Usuário Teste"
          };

          const eventoComOrganizador = {
            ...req.body,
            organizador: {
              _id: req.user._id,
              nome: req.user.nome
            }
          };

          // Mock do safeParse para validação prévia
          EventoSchema.safeParse = jest.fn().mockReturnValue({
            success: true,
            data: eventoComOrganizador
          });

          controller.service.cadastrar.mockResolvedValue(eventoComOrganizador);

          await controller.cadastrar(req, res);

          expect(controller.service.cadastrar).toHaveBeenCalledWith(eventoComOrganizador);
          expect(CommonResponse.created).toHaveBeenCalledWith(res, eventoComOrganizador);
        });

        it('deve lançar erro se validação prévia falhar', async () => {
          req.body = { titulo: 'Evento Teste' };
          req.user = {
            _id: "682520e98e38a409ac2ac569",
            nome: "Usuário Teste"
          };

          const error = new Error('Validation failed');
          EventoSchema.safeParse = jest.fn().mockReturnValue({
            success: false,
            error: error
          });

          await expect(controller.cadastrar(req, res)).rejects.toThrow('Validation failed');
        });

        it('deve processar arquivos quando fornecidos', async () => {
          req.body = { titulo: 'Evento Teste' };
          req.user = {
            _id: "682520e98e38a409ac2ac569",
            nome: "Usuário Teste"
          };
          req.files = { capa: { filename: 'test.jpg' } };

          const eventoComOrganizador = {
            ...req.body,
            organizador: {
              _id: req.user._id,
              nome: req.user.nome
            }
          };

          const midiasProcessadas = { midiaCapa: [{ url: 'test.jpg' }] };

          // Mock do safeParse para validação prévia
          EventoSchema.safeParse = jest.fn()
            .mockReturnValueOnce({
              success: true,
              data: eventoComOrganizador
            })
            .mockReturnValueOnce({
              success: true,
              data: { ...eventoComOrganizador, ...midiasProcessadas }
            });

          controller.uploadService.processarArquivosParaCadastro.mockResolvedValue(midiasProcessadas);
          controller.service.cadastrar.mockResolvedValue({ ...eventoComOrganizador, ...midiasProcessadas });

          await controller.cadastrar(req, res);

          expect(controller.uploadService.processarArquivosParaCadastro).toHaveBeenCalledWith(req.files);
          expect(controller.service.cadastrar).toHaveBeenCalledWith({ ...eventoComOrganizador, ...midiasProcessadas });
        });

        it('deve limpar arquivos se validação final falhar', async () => {
          req.body = { titulo: 'Evento Teste' };
          req.user = {
            _id: "682520e98e38a409ac2ac569",
            nome: "Usuário Teste"
          };
          req.files = { capa: { filename: 'test.jpg' } };

          const eventoComOrganizador = {
            ...req.body,
            organizador: {
              _id: req.user._id,
              nome: req.user.nome
            }
          };

          const error = new Error('Final validation failed');
          EventoSchema.safeParse = jest.fn()
            .mockReturnValueOnce({
              success: true,
              data: eventoComOrganizador
            })
            .mockReturnValueOnce({
              success: false,
              error: error
            });

          controller.uploadService.processarArquivosParaCadastro.mockResolvedValue({ midiaCapa: [] });

          await expect(controller.cadastrar(req, res)).rejects.toThrow('Final validation failed');
          expect(controller.uploadService.limparArquivosProcessados).toHaveBeenCalledWith(req.files);
        });

        it('deve limpar arquivos se serviço falhar', async () => {
          req.body = { titulo: 'Evento Teste' };
          req.user = {
            _id: "682520e98e38a409ac2ac569",
            nome: "Usuário Teste"
          };
          req.files = { capa: { filename: 'test.jpg' } };

          const eventoComOrganizador = {
            ...req.body,
            organizador: {
              _id: req.user._id,
              nome: req.user.nome
            }
          };

          EventoSchema.safeParse = jest.fn()
            .mockReturnValueOnce({
              success: true,
              data: eventoComOrganizador
            })
            .mockReturnValueOnce({
              success: true,
              data: eventoComOrganizador
            });

          controller.uploadService.processarArquivosParaCadastro.mockResolvedValue({ midiaCapa: [] });
          controller.service.cadastrar.mockRejectedValue(new Error('Service failed'));

          await expect(controller.cadastrar(req, res)).rejects.toThrow('Service failed');
          expect(controller.uploadService.limparArquivosProcessados).toHaveBeenCalledWith(req.files);
        });
    });


    // =================================================================
    // Testes adicionais para validações e casos de erro de ID inválido
    // =================================================================
    describe('validação para ID inválido', () => {
      beforeEach(() => {
        jest.spyOn(objectIdSchema, 'parse').mockImplementation(() => {
          throw new Error('ID inválido');
        });
      });

      afterEach(() => {
        objectIdSchema.parse.mockRestore();
      });

      it('listar deve lançar erro se ID inválido for passado', async () => {
        req.params.id = 'id-invalido';

        await expect(controller.listar(req, res)).rejects.toThrow('ID inválido');
        expect(objectIdSchema.parse).toHaveBeenCalledWith(req.params.id);
      });

      it('alterar deve lançar erro se ID inválido for passado', async () => {
        req.params.id = 'id-invalido';
        req.body = { titulo: 'teste' };

        await expect(controller.alterar(req, res)).rejects.toThrow('ID inválido');
        expect(objectIdSchema.parse).toHaveBeenCalledWith('id-invalido');
      });

      it('alterarStatus deve lançar erro se ID inválido for passado', async () => {
        req.params.id = 'id-invalido';
        req.body.status = 'ativo';

        await expect(controller.alterarStatus(req, res)).rejects.toThrow('ID inválido');
        expect(objectIdSchema.parse).toHaveBeenCalledWith('id-invalido');
      });

      it('deletar deve lançar erro se ID inválido for passado', async () => {
        req.params.id = 'id-invalido';

        await expect(controller.deletar(req, res)).rejects.toThrow('ID inválido');
        expect(objectIdSchema.parse).toHaveBeenCalledWith('id-invalido');
      });
    });


    // ==============================================
    // Testes para o método listar e listar por ID
    // ==============================================
    describe('listar e listar por ID', () => {
        it('deve listar todos os eventos quando nenhum ID for passado', async () => {
            const eventos = [{ titulo: 'Evento 1' }, { titulo: 'Evento 2' }];
            req.user = { _id: "682520e98e38a409ac2ac569" };
            controller.service.listar.mockResolvedValue(eventos);

            await controller.listar(req, res);

            expect(controller.service.listar).toHaveBeenCalledWith(req, req.user._id, {});
            expect(CommonResponse.success).toHaveBeenCalledWith(res, eventos);
        });

        it('deve listar um evento por ID válido', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            const evento = { _id: idValido, titulo: 'Evento único' };
            req.params.id = idValido;
            req.user = { _id: "682520e98e38a409ac2ac569" };
            controller.service.listar.mockResolvedValue(evento);

            await controller.listar(req, res);

            expect(controller.service.listar).toHaveBeenCalledWith(req, req.user._id, {});
            expect(CommonResponse.success).toHaveBeenCalledWith(res, evento);
        });

        it('deve lançar erro se o evento não for encontrado', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.user = { _id: "682520e98e38a409ac2ac569" };
            controller.service.listar.mockResolvedValue(null);

            await expect(controller.listar(req, res)).rejects.toThrow('Evento não encontrado');
        });

        it('deve processar query parameters', async () => {
            const eventos = [{ titulo: 'Evento 1' }];
            req.user = { _id: "682520e98e38a409ac2ac569" };
            req.query = { categoria: 'tecnologia' };
            controller.service.listar.mockResolvedValue(eventos);
            EventoQuerySchema.parseAsync.mockResolvedValue(req.query);

            await controller.listar(req, res);

            expect(EventoQuerySchema.parseAsync).toHaveBeenCalledWith(req.query);
            expect(controller.service.listar).toHaveBeenCalledWith(req, req.user._id, {});
        });

        it('deve processar opção apenasVisiveis', async () => {
            const eventos = [{ titulo: 'Evento 1' }];
            req.user = { _id: "682520e98e38a409ac2ac569" };
            req.query = { apenasVisiveis: 'true' };
            controller.service.listar.mockResolvedValue(eventos);
            EventoQuerySchema.parseAsync.mockResolvedValue(req.query);

            await controller.listar(req, res);

            expect(controller.service.listar).toHaveBeenCalledWith(req, req.user._id, { apenasVisiveis: true });
        });
    });


    // ================================
    // Testes para o método alterar
    // ================================
    describe('alterar', () => {
        it('deve alterar um evento com sucesso', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.body = { titulo: 'Novo título' };
            req.user = { _id: "682520e98e38a409ac2ac569" };
            
            EventoUpdateSchema.parse.mockReturnValue(req.body);

            const resultado = { _id: idValido, ...req.body };
            controller.service.alterar.mockResolvedValue(resultado);

            await controller.alterar(req, res);

            expect(EventoUpdateSchema.parse).toHaveBeenCalledWith(req.body);
            expect(controller.service.alterar).toHaveBeenCalledWith(idValido, req.body, req.user._id);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, resultado);
        });
    });

    // ================================
    // Testes para o método gerarQRCode
    // ================================
    describe('gerarQRCode', () => {
        it('deve gerar QR code com sucesso', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.user = { _id: "682520e98e38a409ac2ac569" };
            
            const evento = { 
                _id: idValido, 
                titulo: 'Evento Teste',
                linkInscricao: 'https://exemplo.com/inscricao' 
            };
            const qrCodeData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
            
            controller.service.listar.mockResolvedValue(evento);
            QRCode.toDataURL.mockResolvedValue(qrCodeData);

            await controller.gerarQRCode(req, res);

            expect(controller.service.listar).toHaveBeenCalledWith(idValido, req.user._id);
            expect(QRCode.toDataURL).toHaveBeenCalledWith(evento.linkInscricao);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, {
                evento: evento._id,
                linkInscricao: evento.linkInscricao,
                qrcode: qrCodeData
            }, 200, 'QR Code gerado com sucesso.');
        });

        it('deve lançar erro se ID não for fornecido', async () => {
            req.params = {};
            req.user = { _id: "682520e98e38a409ac2ac569" };
            
            await expect(controller.gerarQRCode(req, res)).rejects.toThrow('Required');
        });

        it('deve lançar erro se evento não for encontrado', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.user = { _id: "682520e98e38a409ac2ac569" };
            
            controller.service.listar.mockResolvedValue(null);

            await expect(controller.gerarQRCode(req, res)).rejects.toThrow();
        });
    });


    // =====================================
    // Testes para o método alterar status
    // =====================================
    describe('alterarStatus', () => {
        it('deve alterar o status do evento com sucesso', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.body = { status: 'ativo' };
            req.user = { _id: "682520e98e38a409ac2ac569" };

            const resultado = { _id: idValido, status: 'ativo' };
            controller.service.alterarStatus.mockResolvedValue(resultado);

            await controller.alterarStatus(req, res);

            expect(controller.service.alterarStatus).toHaveBeenCalledWith(idValido, 'ativo', req.user._id);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, resultado, 200, 'Status do evento alterado com sucesso!');
        });

        it('deve lançar erro se o status for inválido', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.body = { status: 'desconhecido' };
            req.user = { _id: "682520e98e38a409ac2ac569" };

            await expect(controller.alterarStatus(req, res)).rejects.toThrow('Status deve ser ativo ou inativo.');
        });

        it('deve validar mídias quando validarMidias=true', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.body = { status: 'ativo', validarMidias: true };
            req.user = { _id: "682520e98e38a409ac2ac569" };

            const evento = { _id: idValido, titulo: 'Evento teste' };
            const resultado = { _id: idValido, status: 'ativo' };
            
            controller.service.ensureEventExists.mockResolvedValue(evento);
            controller.service.ensureUserIsOwner.mockResolvedValue(true);
            controller.service.validarMidiasObrigatorias.mockResolvedValue(true);
            controller.service.alterarStatus.mockResolvedValue(resultado);

            await controller.alterarStatus(req, res);

            expect(controller.service.ensureEventExists).toHaveBeenCalledWith(idValido);
            expect(controller.service.ensureUserIsOwner).toHaveBeenCalledWith(evento, req.user._id, false);
            expect(controller.service.validarMidiasObrigatorias).toHaveBeenCalledWith(evento);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, resultado, 200, 'Evento cadastrado e ativado com sucesso!');
        });

        it('deve processar status inativo sem validar mídias', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.body = { status: 'inativo' };
            req.user = { _id: "682520e98e38a409ac2ac569" };

            const resultado = { _id: idValido, status: 'inativo' };
            controller.service.alterarStatus.mockResolvedValue(resultado);

            await controller.alterarStatus(req, res);

            expect(controller.service.alterarStatus).toHaveBeenCalledWith(idValido, 'inativo', req.user._id);
            expect(controller.service.ensureEventExists).not.toHaveBeenCalled();
            expect(controller.service.validarMidiasObrigatorias).not.toHaveBeenCalled();
        });
    });

    // =======================================
    // Testes para o método compartilharPermissao
    // =======================================
    describe('compartilharPermissao', () => {
        it('deve compartilhar permissão com sucesso', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            
            req.params.id = idValido;
            req.body = { 
                email: 'usuario@example.com',
                permissao: 'editar',
                expiraEm: futureDate.toISOString()
            };
            req.user = { _id: "682520e98e38a409ac2ac569" };

            const resultado = { success: true };
            controller.service.compartilharPermissao.mockResolvedValue(resultado);

            await controller.compartilharPermissao(req, res);

            expect(controller.service.compartilharPermissao).toHaveBeenCalledWith(
                idValido, 
                req.body.email, 
                req.body.permissao, 
                req.body.expiraEm, 
                req.user._id
            );
            expect(CommonResponse.success).toHaveBeenCalledWith(res, resultado, 200, 'Permissão compartilhada com sucesso!');
        });

        it('deve lançar erro se email for inválido', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.body = { 
                email: 'email-invalido',
                expiraEm: '2024-12-31T23:59:59.999Z'
            };
            req.user = { _id: "682520e98e38a409ac2ac569" };

            await expect(controller.compartilharPermissao(req, res)).rejects.toThrow('Email válido é obrigatório.');
        });

        it('deve lançar erro se data de expiração for passada', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.body = { 
                email: 'usuario@example.com',
                expiraEm: '2020-01-01T00:00:00.000Z'
            };
            req.user = { _id: "682520e98e38a409ac2ac569" };

            await expect(controller.compartilharPermissao(req, res)).rejects.toThrow('Data de expiração deve ser futura.');
        });

        it('deve usar permissão padrão quando não fornecida', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            
            req.params.id = idValido;
            req.body = { 
                email: 'usuario@example.com',
                expiraEm: futureDate.toISOString()
            };
            req.user = { _id: "682520e98e38a409ac2ac569" };

            const resultado = { success: true };
            controller.service.compartilharPermissao.mockResolvedValue(resultado);

            await controller.compartilharPermissao(req, res);

            expect(controller.service.compartilharPermissao).toHaveBeenCalledWith(
                idValido, 
                req.body.email, 
                'editar', // permissão padrão
                req.body.expiraEm, 
                req.user._id
            );
        });
    });


    // ================================
    // Testes para o método deletar
    // ================================
    describe('deletar', () => {
        it('deve deletar um evento com sucesso', async () => {
            const idValido = new mongoose.Types.ObjectId().toString();
            req.params.id = idValido;
            req.user = { _id: "682520e98e38a409ac2ac569" };
            
            const resultado = { acknowledged: true };
            controller.service.deletar.mockResolvedValue(resultado);

            await controller.deletar(req, res);

            expect(controller.service.deletar).toHaveBeenCalledWith(idValido, req.user._id);
            expect(CommonResponse.success).toHaveBeenCalledWith(res, { 
                message: 'Evento excluído(a) com sucesso.',
                data: resultado 
            });
        });

        it('deve lançar erro se ID não for fornecido', async () => {
            req.params = {};
            req.user = { _id: "682520e98e38a409ac2ac569" };
            
            await expect(controller.deletar(req, res)).rejects.toThrow('Required');
        });
    });
});