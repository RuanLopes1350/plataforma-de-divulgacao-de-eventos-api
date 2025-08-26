import UploadService from '../../../services/UploadService.js';
import UploadRepository from '../../../repositories/UploadRepository.js';
import EventoService from '../../../services/EventoService.js';
import { CustomError, HttpStatusCodes } from '../../../utils/helpers/index.js';
import mongoose from 'mongoose';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import logger from '../../../utils/logger.js';

// Mocks
jest.mock('../../../repositories/UploadRepository.js');
jest.mock('../../../services/EventoService.js');
jest.mock('sharp');
jest.mock('fs');
jest.mock('path');
jest.mock('../../../utils/logger.js');

const MockUploadRepository = UploadRepository;
const MockEventoService = EventoService;

describe('UploadService', () => {
    let uploadService;
    let mockRepository;
    let mockEventoService;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockRepository = new MockUploadRepository();
        mockEventoService = new MockEventoService();
        
        uploadService = new UploadService();
        uploadService.repository = mockRepository;
        uploadService.eventoService = mockEventoService;

        // Mock padrão do path.resolve
        path.resolve.mockImplementation((filepath) => `/mock/path/${filepath}`);
        path.join.mockImplementation((...parts) => parts.join('/'));
        
        // Mock padrão do fs
        fs.existsSync.mockReturnValue(true);
        fs.rmSync.mockReturnValue(undefined);
    });

    describe('adicionarMidia', () => {
        const eventoId = new mongoose.Types.ObjectId().toString();
        const usuarioId = new mongoose.Types.ObjectId().toString();
        const mockEvento = { _id: eventoId };
        const mockFile = {
            filename: 'test.jpg',
            size: 2048000, // 2MB
            originalname: 'test.jpg'
        };

        beforeEach(() => {
            mockEventoService.ensureEventExists.mockResolvedValue(mockEvento);
            mockEventoService.ensureUserIsOwner.mockResolvedValue(true);
        });

        it('deve adicionar mídia de vídeo com sucesso', async () => {
            const expectedMidia = {
                _id: expect.any(mongoose.Types.ObjectId),
                url: '/uploads/video/test.jpg',
                tamanhoMb: expect.any(Number),
                altura: 720,
                largura: 1280
            };

            mockRepository.adicionarMidia.mockResolvedValue(expectedMidia);

            const resultado = await uploadService.adicionarMidia(eventoId, 'video', mockFile, usuarioId);

            expect(mockEventoService.ensureEventExists).toHaveBeenCalledWith(eventoId);
            expect(mockEventoService.ensureUserIsOwner).toHaveBeenCalledWith(mockEvento, usuarioId, false);
            expect(mockRepository.adicionarMidia).toHaveBeenCalledWith(eventoId, 'video', expect.objectContaining({
                _id: expect.any(mongoose.Types.ObjectId),
                url: '/uploads/video/test.jpg',
                tamanhoMb: expect.any(Number),
                altura: 720,
                largura: 1280
            }));
            expect(resultado).toEqual(expectedMidia);
        });

        it('deve adicionar mídia de imagem com dimensões corretas', async () => {
            const mockMetadata = {
                height: 720,
                width: 1280
            };

            sharp.mockReturnValue({
                metadata: jest.fn().mockResolvedValue(mockMetadata)
            });

            const expectedMidia = {
                _id: expect.any(mongoose.Types.ObjectId),
                url: '/uploads/capa/test.jpg',
                tamanhoMb: 2,
                altura: 720,
                largura: 1280
            };

            mockRepository.adicionarMidia.mockResolvedValue(expectedMidia);

            const resultado = await uploadService.adicionarMidia(eventoId, 'capa', mockFile, usuarioId);

            expect(sharp).toHaveBeenCalledWith('/mock/path/uploads/capa/test.jpg');
            expect(resultado).toEqual(expectedMidia);
        });

        it('deve rejeitar imagem com dimensões incorretas', async () => {
            const mockMetadata = {
                height: 500,
                width: 800
            };

            sharp.mockReturnValue({
                metadata: jest.fn().mockResolvedValue(mockMetadata)
            });

            uploadService.removerArquivo = jest.fn();

            await expect(
                uploadService.adicionarMidia(eventoId, 'capa', mockFile, usuarioId)
            ).rejects.toThrow(CustomError);

            expect(uploadService.removerArquivo).toHaveBeenCalled();
        });

        it('deve lançar erro se evento não existir', async () => {
            mockEventoService.ensureEventExists.mockRejectedValue(new CustomError({
                statusCode: 404,
                errorType: 'notFound'
            }));

            await expect(
                uploadService.adicionarMidia(eventoId, 'capa', mockFile, usuarioId)
            ).rejects.toThrow(CustomError);
        });

        it('deve lançar erro se usuário não for proprietário', async () => {
            mockEventoService.ensureUserIsOwner.mockRejectedValue(new CustomError({
                statusCode: 403,
                errorType: 'forbidden'
            }));

            await expect(
                uploadService.adicionarMidia(eventoId, 'capa', mockFile, usuarioId)
            ).rejects.toThrow(CustomError);
        });

        it('deve lidar com erro ao remover arquivo com dimensões inválidas', async () => {
            const mockMetadata = { height: 500, width: 800 };
            
            sharp.mockReturnValue({
                metadata: jest.fn().mockResolvedValue(mockMetadata)
            });

            uploadService.removerArquivo = jest.fn().mockImplementation(() => {
                throw new Error('Falha ao remover arquivo');
            });

            await expect(
                uploadService.adicionarMidia(eventoId, 'capa', mockFile, usuarioId)
            ).rejects.toThrow(Error);

            expect(logger.warn).not.toHaveBeenCalled();
        });
    });

    describe('adicionarMultiplasMidias', () => {
        const eventoId = new mongoose.Types.ObjectId().toString();
        const usuarioId = new mongoose.Types.ObjectId().toString();
        const mockEvento = { _id: eventoId };
        const mockFiles = [
            { filename: 'test1.jpg', size: 1048576, originalname: 'test1.jpg' },
            { filename: 'test2.jpg', size: 2097152, originalname: 'test2.jpg' }
        ];

        beforeEach(() => {
            mockEventoService.ensureEventExists.mockResolvedValue(mockEvento);
            mockEventoService.ensureUserIsOwner.mockResolvedValue(true);
        });

        it('deve adicionar múltiplas mídias com sucesso', async () => {
            const mockMetadata = { height: 720, width: 1280 };
            
            sharp.mockReturnValue({
                metadata: jest.fn().mockResolvedValue(mockMetadata)
            });

            const expectedMidias = mockFiles.map(file => ({
                _id: expect.any(mongoose.Types.ObjectId),
                url: `/uploads/carrossel/${file.filename}`,
                tamanhoMb: +(file.size / (1024 * 1024)).toFixed(2),
                altura: 720,
                largura: 1280
            }));

            mockRepository.adicionarMultiplasMidias.mockResolvedValue(expectedMidias);

            const resultado = await uploadService.adicionarMultiplasMidias(eventoId, 'carrossel', mockFiles, usuarioId);

            expect(mockRepository.adicionarMultiplasMidias).toHaveBeenCalledWith(
                eventoId, 
                'carrossel', 
                expectedMidias
            );
            expect(resultado).toEqual(expectedMidias);
        });

        it('deve limpar todos os arquivos se um tiver dimensões inválidas', async () => {
            sharp
                .mockReturnValueOnce({
                    metadata: jest.fn().mockResolvedValue({ height: 720, width: 1280 })
                })
                .mockReturnValueOnce({
                    metadata: jest.fn().mockResolvedValue({ height: 500, width: 800 })
                });

            uploadService.removerArquivo = jest.fn();

            await expect(
                uploadService.adicionarMultiplasMidias(eventoId, 'carrossel', mockFiles, usuarioId)
            ).rejects.toThrow(CustomError);

            expect(uploadService.removerArquivo).toHaveBeenCalledTimes(2);
        });

        it('deve lidar com erro ao limpar arquivos durante validação', async () => {
            sharp
                .mockReturnValueOnce({
                    metadata: jest.fn().mockResolvedValue({ height: 720, width: 1280 })
                })
                .mockReturnValueOnce({
                    metadata: jest.fn().mockResolvedValue({ height: 500, width: 800 })
                });

            uploadService.removerArquivo = jest.fn()
                .mockImplementationOnce(() => true)
                .mockImplementationOnce(() => {
                    throw new Error('Falha ao remover');
                });

            await expect(
                uploadService.adicionarMultiplasMidias(eventoId, 'carrossel', mockFiles, usuarioId)
            ).rejects.toThrow(Error);

            expect(logger.warn).not.toHaveBeenCalled();
        });
    });

    describe('listarTodasMidias', () => {
        const eventoId = new mongoose.Types.ObjectId().toString();

        it('deve listar todas as mídias do evento', async () => {
            const mockEvento = {
                midiaCapa: [{ url: '/uploads/capa/test.jpg' }],
                midiaCarrossel: [{ url: '/uploads/carrossel/test.jpg' }],
                midiaVideo: [{ url: '/uploads/video/test.mp4' }]
            };

            mockRepository.listarTodasMidias.mockResolvedValue(mockEvento);

            const resultado = await uploadService.listarTodasMidias(eventoId);

            expect(mockRepository.listarTodasMidias).toHaveBeenCalledWith(eventoId);
            expect(resultado).toEqual({
                capa: mockEvento.midiaCapa,
                carrossel: mockEvento.midiaCarrossel,
                video: mockEvento.midiaVideo
            });
        });

        it('deve lançar erro se evento ID for inválido', async () => {
            await expect(
                uploadService.listarTodasMidias('invalid-id')
            ).rejects.toThrow();
        });
    });

    describe('listarMidiaCapa', () => {
        const eventoId = new mongoose.Types.ObjectId().toString();

        it('deve listar mídia capa do evento', async () => {
            const mockEvento = {
                midiaCapa: [{ url: '/uploads/capa/test.jpg' }]
            };

            mockRepository.listarMidiaCapa.mockResolvedValue(mockEvento);

            const resultado = await uploadService.listarMidiaCapa(eventoId);

            expect(resultado).toEqual({ midiaCapa: mockEvento.midiaCapa });
        });
    });

    describe('listarMidiaVideo', () => {
        const eventoId = new mongoose.Types.ObjectId().toString();

        it('deve listar mídia video do evento', async () => {
            const mockEvento = {
                midiaVideo: [{ url: '/uploads/video/test.mp4' }]
            };

            mockRepository.listarMidiaVideo.mockResolvedValue(mockEvento);

            const resultado = await uploadService.listarMidiaVideo(eventoId);

            expect(resultado).toEqual({ midiaVideo: mockEvento.midiaVideo });
        });
    });

    describe('listarMidiaCarrossel', () => {
        const eventoId = new mongoose.Types.ObjectId().toString();

        it('deve listar mídia carrossel do evento', async () => {
            const mockEvento = {
                midiaCarrossel: [{ url: '/uploads/carrossel/test.jpg' }]
            };

            mockRepository.listarMidiaCarrossel.mockResolvedValue(mockEvento);

            const resultado = await uploadService.listarMidiaCarrossel(eventoId);

            expect(resultado).toEqual({ midiaCarrossel: mockEvento.midiaCarrossel });
        });
    });

    describe('deletarMidia', () => {
        const eventoId = new mongoose.Types.ObjectId().toString();
        const midiaId = new mongoose.Types.ObjectId().toString();
        const usuarioId = new mongoose.Types.ObjectId().toString();
        const mockEvento = { _id: eventoId };

        beforeEach(() => {
            mockEventoService.ensureEventExists.mockResolvedValue(mockEvento);
            mockEventoService.ensureUserIsOwner.mockResolvedValue(true);
        });

        it('deve deletar mídia com sucesso', async () => {
            const mockMidiaRemovida = {
                _id: midiaId,
                url: '/uploads/capa/test.jpg'
            };

            mockRepository.deletarMidia.mockResolvedValue(mockMidiaRemovida);
            uploadService.removerArquivo = jest.fn().mockReturnValue(true);

            const resultado = await uploadService.deletarMidia(eventoId, 'capa', midiaId, usuarioId);

            expect(mockRepository.deletarMidia).toHaveBeenCalledWith(eventoId, 'capa', midiaId);
            expect(uploadService.removerArquivo).toHaveBeenCalledWith('/uploads/capa/test.jpg');
            expect(resultado).toEqual(mockMidiaRemovida);
        });

        it('deve lidar com erro ao remover arquivo físico', async () => {
            const mockMidiaRemovida = {
                _id: midiaId,
                url: '/uploads/capa/test.jpg'
            };

            mockRepository.deletarMidia.mockResolvedValue(mockMidiaRemovida);
            uploadService.removerArquivo = jest.fn().mockImplementation(() => {
                throw new Error('Falha ao remover arquivo');
            });

            // O método deve lançar o erro pois removerArquivo não está em try/catch
            await expect(
                uploadService.deletarMidia(eventoId, 'capa', midiaId, usuarioId)
            ).rejects.toThrow(Error);

            expect(logger.warn).not.toHaveBeenCalled();
        });
    });

    describe('processarArquivosParaCadastro', () => {
        it('deve processar arquivos de vídeo com sucesso', async () => {
            const files = {
                midiaVideo: [{
                    filename: 'video.mp4',
                    size: 5242880, // 5MB
                    path: '/mock/path/video.mp4'
                }]
            };

            const resultado = await uploadService.processarArquivosParaCadastro(files);

            expect(resultado.midiaVideo).toHaveLength(1);
            expect(resultado.midiaVideo[0]).toEqual({
                url: '/uploads/video/video.mp4',
                tamanhoMb: 5,
                altura: 720,
                largura: 1280
            });
        });

        it('deve processar imagens com dimensões corretas', async () => {
            const files = {
                midiaCapa: [{
                    filename: 'capa.jpg',
                    size: 2097152, // 2MB
                    path: '/mock/path/capa.jpg',
                    originalname: 'capa.jpg'
                }]
            };

            sharp.mockReturnValue({
                metadata: jest.fn().mockResolvedValue({ height: 720, width: 1280 })
            });

            const resultado = await uploadService.processarArquivosParaCadastro(files);

            expect(resultado.midiaCapa).toHaveLength(1);
            expect(resultado.midiaCapa[0]).toEqual({
                url: '/uploads/capa/capa.jpg',
                tamanhoMb: 2,
                altura: 720,
                largura: 1280
            });
        });

        it('deve lançar erro para arquivo corrompido', async () => {
            const files = {
                midiaCapa: [{
                    filename: 'corrupted.jpg',
                    size: 1048576,
                    path: '/mock/path/corrupted.jpg',
                    originalname: 'corrupted.jpg'
                }]
            };

            sharp.mockReturnValue({
                metadata: jest.fn().mockRejectedValue(new Error('Arquivo corrompido'))
            });

            uploadService.limparArquivosProcessados = jest.fn();

            await expect(
                uploadService.processarArquivosParaCadastro(files)
            ).rejects.toThrow(CustomError);

            expect(uploadService.limparArquivosProcessados).toHaveBeenCalledWith(files);
        });

        it('deve lançar erro para dimensões inválidas', async () => {
            const files = {
                midiaCapa: [{
                    filename: 'invalid.jpg',
                    size: 1048576,
                    path: '/mock/path/invalid.jpg',
                    originalname: 'invalid.jpg'
                }]
            };

            sharp.mockReturnValue({
                metadata: jest.fn().mockResolvedValue({ height: 500, width: 800 })
            });

            uploadService.limparArquivosProcessados = jest.fn();

            await expect(
                uploadService.processarArquivosParaCadastro(files)
            ).rejects.toThrow(CustomError);

            expect(uploadService.limparArquivosProcessados).toHaveBeenCalledWith(files);
        });

        it('deve ignorar tipos de arquivo não reconhecidos', async () => {
            const files = {
                tipoInvalido: [{
                    filename: 'test.txt',
                    size: 1024,
                    path: '/mock/path/test.txt'
                }],
                midiaCapa: [{
                    filename: 'capa.jpg',
                    size: 2097152,
                    path: '/mock/path/capa.jpg',
                    originalname: 'capa.jpg'
                }]
            };

            sharp.mockReturnValue({
                metadata: jest.fn().mockResolvedValue({ height: 720, width: 1280 })
            });

            const resultado = await uploadService.processarArquivosParaCadastro(files);

            expect(resultado.midiaCapa).toHaveLength(1);
            expect(resultado.midiaVideo).toHaveLength(0);
            expect(resultado.midiaCarrossel).toHaveLength(0);
        });
    });

    describe('removerArquivo', () => {
        beforeEach(() => {
            // Mock process.cwd
            jest.spyOn(process, 'cwd').mockReturnValue('/mock/project');
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('deve remover arquivo com URL relativa', () => {
            fs.existsSync.mockReturnValue(true);
            fs.rmSync.mockReturnValue(undefined);

            const resultado = uploadService.removerArquivo('/uploads/capa/test.jpg');

            expect(path.join).toHaveBeenCalledWith('/mock/project', '/uploads/capa/test.jpg');
            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.rmSync).toHaveBeenCalled();
            expect(resultado).toBe(true);
        });

        it('deve remover arquivo com caminho absoluto', () => {
            fs.existsSync.mockReturnValue(true);
            fs.rmSync.mockReturnValue(undefined);
            path.resolve.mockReturnValue('/absolute/path/file.jpg');

            const resultado = uploadService.removerArquivo('/absolute/path/file.jpg');

            expect(resultado).toBe(true);
        });

        it('deve retornar false se arquivo não existir', () => {
            fs.existsSync.mockReturnValue(false);

            const resultado = uploadService.removerArquivo('/uploads/capa/test.jpg');

            expect(resultado).toBe(false);
        });

        it('deve lidar com caminho que começa com /', () => {
            fs.existsSync.mockReturnValue(true);
            fs.rmSync.mockReturnValue(undefined);

            uploadService.removerArquivo('/some/path/file.jpg');

            expect(path.join).toHaveBeenCalledWith('/mock/project', '/some/path/file.jpg');
        });
    });

    describe('limparArquivosProcessados', () => {
        it('deve limpar todos os arquivos processados', () => {
            const files = {
                midiaCapa: [{
                    path: '/mock/path/capa.jpg'
                }],
                midiaVideo: [{
                    path: '/mock/path/video.mp4'
                }]
            };

            uploadService.removerArquivo = jest.fn().mockReturnValue(true);

            uploadService.limparArquivosProcessados(files);

            expect(uploadService.removerArquivo).toHaveBeenCalledTimes(2);
            expect(uploadService.removerArquivo).toHaveBeenCalledWith('/mock/path/capa.jpg');
            expect(uploadService.removerArquivo).toHaveBeenCalledWith('/mock/path/video.mp4');
        });

        it('deve lidar com erro ao remover arquivo', () => {
            const files = {
                midiaCapa: [{
                    path: '/mock/path/capa.jpg'
                }]
            };

            uploadService.removerArquivo = jest.fn().mockImplementation(() => {
                throw new Error('Falha ao remover');
            });

            expect(() => {
                uploadService.limparArquivosProcessados(files);
            }).toThrow(Error);

            expect(logger.warn).not.toHaveBeenCalled();
        });
    });

    describe('limparMidiasDoEvento', () => {
        it('deve limpar todas as mídias do evento', () => {
            const evento = {
                _id: 'evento123',
                midiaVideo: [{ url: '/uploads/video/test.mp4' }],
                midiaCapa: [{ url: '/uploads/capa/test.jpg' }],
                midiaCarrossel: [
                    { url: '/uploads/carrossel/test1.jpg' },
                    { url: '/uploads/carrossel/test2.jpg' }
                ]
            };

            uploadService.removerArquivo = jest.fn().mockReturnValue(true);

            uploadService.limparMidiasDoEvento(evento);

            expect(uploadService.removerArquivo).toHaveBeenCalledTimes(4);
        });

        it('deve ignorar URLs inválidas', () => {
            const evento = {
                _id: 'evento123',
                midiaCapa: [
                    { url: '/uploads/capa/test.jpg' },
                    { url: 'http://external.com/image.jpg' }, // URL externa
                    { }, // Sem URL
                    { url: null } // URL null
                ]
            };

            uploadService.removerArquivo = jest.fn().mockReturnValue(true);

            uploadService.limparMidiasDoEvento(evento);

            expect(uploadService.removerArquivo).toHaveBeenCalledTimes(1);
            expect(uploadService.removerArquivo).toHaveBeenCalledWith('/uploads/capa/test.jpg');
        });

        it('deve lidar com erro ao remover arquivo', () => {
            const evento = {
                _id: 'evento123',
                midiaCapa: [{ url: '/uploads/capa/test.jpg' }]
            };

            uploadService.removerArquivo = jest.fn().mockImplementation(() => {
                throw new Error('Falha ao remover');
            });

            expect(() => {
                uploadService.limparMidiasDoEvento(evento);
            }).toThrow(Error);

            expect(logger.warn).not.toHaveBeenCalled();
        });

        it('deve lidar com arrays de mídia vazios ou undefined', () => {
            const evento = {
                _id: 'evento123',
                midiaVideo: [],
                midiaCapa: undefined,
                midiaCarrossel: null
            };

            uploadService.removerArquivo = jest.fn();

            uploadService.limparMidiasDoEvento(evento);

            expect(uploadService.removerArquivo).not.toHaveBeenCalled();
        });
    });
});
