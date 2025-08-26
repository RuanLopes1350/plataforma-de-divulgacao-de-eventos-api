import UploadRepository from '../../../repositories/UploadRepository.js';
import { CustomError, HttpStatusCodes, messages } from '../../../utils/helpers/index.js';

describe('UploadRepository', () => {
    let uploadRepository;
    let mockEventoModel;
    let mockEvento;

    beforeEach(() => {
        mockEvento = {
            _id: '64f5b8c8d1234567890abcde',
            titulo: 'Evento Test',
            midiaCapa: [],
            midiaCarrossel: [],
            midiaVideo: [],
            save: jest.fn().mockResolvedValue(true)
        };

        mockEventoModel = {
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn()
        };

        uploadRepository = new UploadRepository({ eventoModel: mockEventoModel });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('_ensureEventExists', () => {
        it('deve retornar evento se existir', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const resultado = await uploadRepository._ensureEventExists('64f5b8c8d1234567890abcde');

            expect(resultado).toBe(mockEvento);
            expect(mockEventoModel.findById).toHaveBeenCalledWith('64f5b8c8d1234567890abcde');
        });

        it('deve lançar erro se evento não existir', async () => {
            mockEventoModel.findById.mockResolvedValue(null);

            await expect(uploadRepository._ensureEventExists('64f5b8c8d1234567890abcde'))
                .rejects
                .toThrow(CustomError);

            expect(mockEventoModel.findById).toHaveBeenCalledWith('64f5b8c8d1234567890abcde');
        });
    });

    describe('adicionarMidia', () => {
        it('deve adicionar mídia capa com sucesso', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const midia = {
                _id: '64f5b8c8d1234567890abcdf',
                url: '/uploads/capa/image.jpg',
                tamanhoMb: 2.5
            };

            const resultado = await uploadRepository.adicionarMidia('64f5b8c8d1234567890abcde', 'capa', midia);

            expect(resultado).toBe(midia);
            expect(mockEvento.midiaCapa).toContain(midia);
            expect(mockEvento.save).toHaveBeenCalled();
        });

        it('deve adicionar mídia carrossel com sucesso', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const midia = {
                _id: '64f5b8c8d1234567890abcdf',
                url: '/uploads/carrossel/image.jpg',
                tamanhoMb: 3.2
            };

            const resultado = await uploadRepository.adicionarMidia('64f5b8c8d1234567890abcde', 'carrossel', midia);

            expect(resultado).toBe(midia);
            expect(mockEvento.midiaCarrossel).toContain(midia);
            expect(mockEvento.save).toHaveBeenCalled();
        });

        it('deve adicionar mídia video com sucesso', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const midia = {
                _id: '64f5b8c8d1234567890abcdf',
                url: '/uploads/video/video.mp4',
                tamanhoMb: 15.8
            };

            const resultado = await uploadRepository.adicionarMidia('64f5b8c8d1234567890abcde', 'video', midia);

            expect(resultado).toBe(midia);
            expect(mockEvento.midiaVideo).toContain(midia);
            expect(mockEvento.save).toHaveBeenCalled();
        });

        it('deve lançar erro para tipo de mídia inválido', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const midia = {
                _id: '64f5b8c8d1234567890abcdf',
                url: '/uploads/documento/document.pdf',
                tamanhoMb: 1.2
            };

            await expect(uploadRepository.adicionarMidia('64f5b8c8d1234567890abcde', 'documento', midia))
                .rejects
                .toThrow(CustomError);
        });

        it('deve lançar erro se evento não existir', async () => {
            mockEventoModel.findById.mockResolvedValue(null);

            const midia = {
                _id: '64f5b8c8d1234567890abcdf',
                url: '/uploads/capa/image.jpg',
                tamanhoMb: 2.5
            };

            await expect(uploadRepository.adicionarMidia('64f5b8c8d1234567890abcde', 'capa', midia))
                .rejects
                .toThrow(CustomError);
        });
    });

    describe('adicionarMultiplasMidias', () => {
        it('deve adicionar múltiplas mídias com sucesso', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);
            mockEventoModel.findByIdAndUpdate.mockResolvedValue(mockEvento);

            const midias = [
                {
                    _id: '64f5b8c8d1234567890abcdf',
                    url: '/uploads/carrossel/image1.jpg',
                    tamanhoMb: 2.5
                },
                {
                    _id: '64f5b8c8d1234567890abce0',
                    url: '/uploads/carrossel/image2.jpg',
                    tamanhoMb: 3.1
                }
            ];

            const resultado = await uploadRepository.adicionarMultiplasMidias('64f5b8c8d1234567890abcde', 'carrossel', midias);

            expect(resultado).toBe(mockEvento);
            expect(mockEventoModel.findByIdAndUpdate).toHaveBeenCalledWith(
                '64f5b8c8d1234567890abcde',
                { $push: { midiaCarrossel: { $each: midias } } },
                { new: true }
            );
        });

        it('deve lançar erro para tipo de mídia inválido', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const midias = [{
                _id: '64f5b8c8d1234567890abcdf',
                url: '/uploads/documento/document.pdf',
                tamanhoMb: 1.2
            }];

            await expect(uploadRepository.adicionarMultiplasMidias('64f5b8c8d1234567890abcde', 'documento', midias))
                .rejects
                .toThrow(CustomError);
        });

        it('deve lançar erro se evento não existir', async () => {
            mockEventoModel.findById.mockResolvedValue(null);

            const midias = [{
                _id: '64f5b8c8d1234567890abcdf',
                url: '/uploads/carrossel/image.jpg',
                tamanhoMb: 2.5
            }];

            await expect(uploadRepository.adicionarMultiplasMidias('64f5b8c8d1234567890abcde', 'carrossel', midias))
                .rejects
                .toThrow(CustomError);
        });

        it('deve lançar erro se falhar ao atualizar evento', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);
            mockEventoModel.findByIdAndUpdate.mockResolvedValue(null);

            const midias = [{
                _id: '64f5b8c8d1234567890abcdf',
                url: '/uploads/carrossel/image.jpg',
                tamanhoMb: 2.5
            }];

            await expect(uploadRepository.adicionarMultiplasMidias('64f5b8c8d1234567890abcde', 'carrossel', midias))
                .rejects
                .toThrow(CustomError);
        });
    });

    describe('listarTodasMidias', () => {
        it('deve listar todas as mídias do evento', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const resultado = await uploadRepository.listarTodasMidias('64f5b8c8d1234567890abcde');

            expect(resultado).toBe(mockEvento);
            expect(mockEventoModel.findById).toHaveBeenCalledWith('64f5b8c8d1234567890abcde');
        });

        it('deve lançar erro se evento não existir', async () => {
            mockEventoModel.findById.mockResolvedValue(null);

            await expect(uploadRepository.listarTodasMidias('64f5b8c8d1234567890abcde'))
                .rejects
                .toThrow(CustomError);
        });
    });

    describe('listarMidiaCapa', () => {
        it('deve listar mídia capa do evento', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const resultado = await uploadRepository.listarMidiaCapa('64f5b8c8d1234567890abcde');

            expect(resultado).toEqual({ midiaCapa: mockEvento.midiaCapa });
            expect(mockEventoModel.findById).toHaveBeenCalledWith('64f5b8c8d1234567890abcde');
        });

        it('deve lançar erro se evento não existir', async () => {
            mockEventoModel.findById.mockResolvedValue(null);

            await expect(uploadRepository.listarMidiaCapa('64f5b8c8d1234567890abcde'))
                .rejects
                .toThrow(CustomError);
        });
    });

    describe('listarMidiaVideo', () => {
        it('deve listar mídia video do evento', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const resultado = await uploadRepository.listarMidiaVideo('64f5b8c8d1234567890abcde');

            expect(resultado).toEqual({ midiaVideo: mockEvento.midiaVideo });
            expect(mockEventoModel.findById).toHaveBeenCalledWith('64f5b8c8d1234567890abcde');
        });

        it('deve lançar erro se evento não existir', async () => {
            mockEventoModel.findById.mockResolvedValue(null);

            await expect(uploadRepository.listarMidiaVideo('64f5b8c8d1234567890abcde'))
                .rejects
                .toThrow(CustomError);
        });
    });

    describe('listarMidiaCarrossel', () => {
        it('deve listar mídia carrossel do evento', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const resultado = await uploadRepository.listarMidiaCarrossel('64f5b8c8d1234567890abcde');

            expect(resultado).toEqual({ midiaCarrossel: mockEvento.midiaCarrossel });
            expect(mockEventoModel.findById).toHaveBeenCalledWith('64f5b8c8d1234567890abcde');
        });

        it('deve lançar erro se evento não existir', async () => {
            mockEventoModel.findById.mockResolvedValue(null);

            await expect(uploadRepository.listarMidiaCarrossel('64f5b8c8d1234567890abcde'))
                .rejects
                .toThrow(CustomError);
        });
    });

    describe('deletarMidia', () => {
        beforeEach(() => {
            mockEvento.midiaCapa = [
                {
                    _id: '64f5b8c8d1234567890abcdf',
                    url: '/uploads/capa/image.jpg',
                    tamanhoMb: 2.5
                }
            ];
            mockEvento.midiaCarrossel = [
                {
                    _id: '64f5b8c8d1234567890abce0',
                    url: '/uploads/carrossel/image.jpg',
                    tamanhoMb: 3.1
                }
            ];
        });

        it('deve deletar mídia capa com sucesso', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const midiaEsperada = mockEvento.midiaCapa[0];
            const resultado = await uploadRepository.deletarMidia('64f5b8c8d1234567890abcde', 'capa', '64f5b8c8d1234567890abcdf');

            expect(resultado).toEqual(midiaEsperada);
            expect(mockEvento.midiaCapa).toHaveLength(0);
            expect(mockEvento.save).toHaveBeenCalled();
        });

        it('deve deletar mídia carrossel com sucesso', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            const midiaEsperada = mockEvento.midiaCarrossel[0];
            const resultado = await uploadRepository.deletarMidia('64f5b8c8d1234567890abcde', 'carrossel', '64f5b8c8d1234567890abce0');

            expect(resultado).toEqual(midiaEsperada);
            expect(mockEvento.midiaCarrossel).toHaveLength(0);
            expect(mockEvento.save).toHaveBeenCalled();
        });

        it('deve lançar erro para tipo de mídia inválido', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            await expect(uploadRepository.deletarMidia('64f5b8c8d1234567890abcde', 'documento', '64f5b8c8d1234567890abcdf'))
                .rejects
                .toThrow(CustomError);
        });

        it('deve lançar erro se evento não existir', async () => {
            mockEventoModel.findById.mockResolvedValue(null);

            await expect(uploadRepository.deletarMidia('64f5b8c8d1234567890abcde', 'capa', '64f5b8c8d1234567890abcdf'))
                .rejects
                .toThrow(CustomError);
        });

        it('deve lançar erro se mídia não for encontrada', async () => {
            mockEventoModel.findById.mockResolvedValue(mockEvento);

            await expect(uploadRepository.deletarMidia('64f5b8c8d1234567890abcde', 'capa', '64f5b8c8d1234567890abcxx'))
                .rejects
                .toThrow(CustomError);
        });
    });
});
