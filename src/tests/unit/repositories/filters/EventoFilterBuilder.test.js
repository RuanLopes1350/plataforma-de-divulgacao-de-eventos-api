import EventoFilterBuilder from '../../../../repositories/filters/EventoFilterBuilder.js';
import { startOfDay, endOfDay } from 'date-fns';
import mongoose from 'mongoose';

describe('EventoFilterBuilder', () => {
    let filterBuilder;
    let mockEventoRepository;
    let mockUsuarioRepository;
    let mockEventoModel;
    let mockUsuarioModel;

    beforeEach(() => {
        mockEventoRepository = {
            listar: jest.fn(),
            listarPorId: jest.fn()
        };

        mockUsuarioRepository = {
            listar: jest.fn(),
            buscarPorEmail: jest.fn()
        };

        mockEventoModel = {
            find: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([])
                    })
                }),
                countDocuments: jest.fn().mockResolvedValue(0)
            }),
            countDocuments: jest.fn().mockResolvedValue(0)
        };

        mockUsuarioModel = {
            find: jest.fn().mockResolvedValue([])
        };

        filterBuilder = new EventoFilterBuilder();
        filterBuilder.eventoRepository = mockEventoRepository;
        filterBuilder.usuarioRepository = mockUsuarioRepository;
        filterBuilder.eventoModel = mockEventoModel;
        filterBuilder.usuarioModel = mockUsuarioModel;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('comTitulo', () => {
        it('deve adicionar filtro por título', () => {
            const resultado = filterBuilder.comTitulo('Evento Teste');

            expect(filterBuilder.filtros.titulo).toEqual({
                $regex: 'Evento\\ Teste',
                $options: 'i'
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se título for vazio', () => {
            const resultado = filterBuilder.comTitulo('');

            expect(filterBuilder.filtros.titulo).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se título for null', () => {
            const resultado = filterBuilder.comTitulo(null);

            expect(filterBuilder.filtros.titulo).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('comDescricao', () => {
        it('deve adicionar filtro por descrição', () => {
            const resultado = filterBuilder.comDescricao('Descrição teste');

            expect(filterBuilder.filtros.descricao).toEqual({
                $regex: 'Descrição\\ teste',
                $options: 'i'
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se descrição for vazia', () => {
            const resultado = filterBuilder.comDescricao('');

            expect(filterBuilder.filtros.descricao).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('comLocal', () => {
        it('deve adicionar filtro por local', () => {
            const resultado = filterBuilder.comLocal('Auditório Principal');

            expect(filterBuilder.filtros.local).toEqual({
                $regex: 'Auditório\\ Principal',
                $options: 'i'
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se local for vazio', () => {
            const resultado = filterBuilder.comLocal('');

            expect(filterBuilder.filtros.local).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('comCategoria', () => {
        it('deve adicionar filtro por categoria', () => {
            const resultado = filterBuilder.comCategoria('Tecnologia');

            expect(filterBuilder.filtros.categoria).toEqual({
                $regex: 'Tecnologia',
                $options: 'i'
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se categoria for vazia', () => {
            const resultado = filterBuilder.comCategoria('');

            expect(filterBuilder.filtros.categoria).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('comTags', () => {
        it('deve adicionar filtro por tags como array', () => {
            const resultado = filterBuilder.comTags(['javascript', 'nodejs', 'api']);

            expect(filterBuilder.filtros.tags).toEqual({
                $in: ['javascript', 'nodejs', 'api']
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('deve adicionar filtro por tags como string separada por vírgula', () => {
            const resultado = filterBuilder.comTags('javascript,nodejs,api');

            expect(filterBuilder.filtros.tags).toEqual({
                $in: ['javascript', 'nodejs', 'api']
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('deve tratar tags com espaços extras', () => {
            const resultado = filterBuilder.comTags('javascript , nodejs , api ');

            expect(filterBuilder.filtros.tags).toEqual({
                $in: ['javascript', 'nodejs', 'api']
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se tags for array vazio', () => {
            const resultado = filterBuilder.comTags([]);

            expect(filterBuilder.filtros.tags).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se tags for string vazia', () => {
            const resultado = filterBuilder.comTags('');

            expect(filterBuilder.filtros.tags).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('comStatus', () => {
        it('deve adicionar filtro por status único', () => {
            const resultado = filterBuilder.comStatus('ativo');

            expect(filterBuilder.filtros.status).toBe('ativo');
            expect(resultado).toBe(filterBuilder);
        });

        it('deve adicionar filtro por status como array', () => {
            const resultado = filterBuilder.comStatus(['ativo', 'inativo']);

            expect(filterBuilder.filtros.status).toEqual({
                $in: ['ativo', 'inativo']
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('deve filtrar status inválidos do array', () => {
            const resultado = filterBuilder.comStatus(['ativo', 'inválido', 'inativo']);

            expect(filterBuilder.filtros.status).toEqual({
                $in: ['ativo', 'inativo']
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se status for inválido', () => {
            const resultado = filterBuilder.comStatus('inválido');

            expect(filterBuilder.filtros.status).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se array de status for vazio após filtrar', () => {
            const resultado = filterBuilder.comStatus(['inválido', 'outro']);

            expect(filterBuilder.filtros.status).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('comTipo', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2023-06-15T10:00:00Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('deve adicionar filtro para tipo histórico', () => {
            const resultado = filterBuilder.comTipo('historico');

            expect(filterBuilder.filtros.dataEvento).toEqual({
                $lt: new Date('2023-06-15T10:00:00Z')
            });
            expect(filterBuilder.filtros.status).toBe('ativo');
            expect(resultado).toBe(filterBuilder);
        });

        it('deve adicionar filtro para tipo ativo', () => {
            const dataAtual = new Date('2023-06-15T10:00:00Z');
            const resultado = filterBuilder.comTipo('ativo');

            expect(filterBuilder.filtros.dataEvento).toEqual({
                $gte: startOfDay(dataAtual),
                $lte: endOfDay(dataAtual)
            });
            expect(filterBuilder.filtros.status).toBe('ativo');
            expect(resultado).toBe(filterBuilder);
        });

        it('deve adicionar filtro para tipo futuro', () => {
            const resultado = filterBuilder.comTipo('futuro');

            expect(filterBuilder.filtros.dataEvento).toEqual({
                $gt: new Date('2023-06-15T10:00:00Z')
            });
            expect(filterBuilder.filtros.status).toBe('ativo');
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve sobrescrever status se já definido', () => {
            filterBuilder.comStatus('inativo');
            const resultado = filterBuilder.comTipo('historico');

            expect(filterBuilder.filtros.status).toBe('inativo');
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se tipo for inválido', () => {
            const resultado = filterBuilder.comTipo('inválido');

            expect(filterBuilder.filtros.dataEvento).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('escapeRegex', () => {
        it('deve escapar caracteres especiais de regex', () => {
            const resultado = filterBuilder.escapeRegex('test[.*+?^${}()|\\]');

            expect(resultado).toBe('test\\[\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\\\\\]');
        });

        it('deve retornar string vazia para entrada vazia', () => {
            const resultado = filterBuilder.escapeRegex('');

            expect(resultado).toBe('');
        });

        it('deve retornar string normal se não há caracteres especiais', () => {
            const resultado = filterBuilder.escapeRegex('eventoteste');

            expect(resultado).toBe('eventoteste');
        });
    });

    describe('build', () => {
        it('deve retornar filtros vazios inicialmente', () => {
            const resultado = filterBuilder.build();

            expect(resultado).toEqual({});
        });

        it('deve retornar filtros após adicionar condições', () => {
            filterBuilder
                .comTitulo('Evento Teste')
                .comStatus('ativo')
                .comCategoria('Tecnologia');

            const resultado = filterBuilder.build();

            expect(resultado).toEqual({
                titulo: { $regex: 'Evento\\ Teste', $options: 'i' },
                status: 'ativo',
                categoria: { $regex: 'Tecnologia', $options: 'i' }
            });
        });
    });

    describe('comIntervaloData', () => {
        it('deve adicionar filtro por data de início', () => {
            const dataInicio = '2023-06-15';
            const resultado = filterBuilder.comIntervaloData(dataInicio, null);

            expect(filterBuilder.filtros.dataEvento).toEqual({
                $gte: new Date(dataInicio)
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('deve adicionar filtro por data de fim', () => {
            const dataFim = '2023-06-16';
            const resultado = filterBuilder.comIntervaloData(null, dataFim);

            expect(filterBuilder.filtros.dataEvento).toEqual({
                $lte: new Date(dataFim)
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('deve adicionar filtro por intervalo de datas', () => {
            const dataInicio = '2023-06-15';
            const dataFim = '2023-06-16';
            const resultado = filterBuilder.comIntervaloData(dataInicio, dataFim);

            expect(filterBuilder.filtros.dataEvento).toEqual({
                $gte: new Date(dataInicio),
                $lte: new Date(dataFim)
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('deve remover filtro de data se ambas forem null e não há filtros existentes', () => {
            const resultado = filterBuilder.comIntervaloData(null, null);

            expect(filterBuilder.filtros.dataEvento).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('comOrganizador', () => {
        it('deve adicionar filtro por ID do organizador', () => {
            const organizadorId = '64f5b8c8d1234567890abcde';
            const resultado = filterBuilder.comOrganizador(organizadorId);

            expect(filterBuilder.filtros['organizador._id'].toString()).toBe(organizadorId);
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se ID for inválido', () => {
            const resultado = filterBuilder.comOrganizador('invalid-id');

            expect(filterBuilder.filtros['organizador._id']).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se ID for null', () => {
            const resultado = filterBuilder.comOrganizador(null);

            expect(filterBuilder.filtros['organizador._id']).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('comOrganizadorNome', () => {
        it('deve adicionar filtro por nome do organizador', async () => {
            const mockUsuarios = [
                { _id: '64f5b8c8d1234567890abcde' },
                { _id: '64f5b8c8d1234567890abcdf' }
            ];

            mockUsuarioModel.find.mockResolvedValue(mockUsuarios);

            const resultado = await filterBuilder.comOrganizadorNome('João Silva');

            expect(mockUsuarioModel.find).toHaveBeenCalledWith({
                nome: { $regex: new RegExp('João Silva', 'i') }
            });
            expect(filterBuilder.filtros['organizador._id']).toEqual({
                $in: ['64f5b8c8d1234567890abcde', '64f5b8c8d1234567890abcdf']
            });
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se nenhum usuário for encontrado', async () => {
            mockUsuarioModel.find.mockResolvedValue([]);

            const resultado = await filterBuilder.comOrganizadorNome('Usuário Inexistente');

            expect(filterBuilder.filtros['organizador._id']).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se nome for vazio', async () => {
            const resultado = await filterBuilder.comOrganizadorNome('');

            expect(mockUsuarioModel.find).not.toHaveBeenCalled();
            expect(filterBuilder.filtros['organizador._id']).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });

    describe('comPermissao', () => {
        it('deve adicionar filtro de permissão para usuário válido', () => {
            const usuarioId = '64f5b8c8d1234567890abcde';
            const resultado = filterBuilder.comPermissao(usuarioId);

            expect(filterBuilder.filtros.$or).toHaveLength(2);
            expect(filterBuilder.filtros.$or[0]).toEqual({
                'organizador._id': expect.any(Object)
            });
            expect(filterBuilder.filtros.$or[1].permissoes.$elemMatch.usuario.toString()).toBe(usuarioId);
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se ID for inválido', () => {
            const resultado = filterBuilder.comPermissao('invalid-id');

            expect(filterBuilder.filtros.$or).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });

        it('não deve adicionar filtro se ID for null', () => {
            const resultado = filterBuilder.comPermissao(null);

            expect(filterBuilder.filtros.$or).toBeUndefined();
            expect(resultado).toBe(filterBuilder);
        });
    });
});
