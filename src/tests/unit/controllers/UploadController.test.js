// /src/tests/unit/controllers/UploadController.test.js

import UploadController from '../../../controllers/UploadController.js';
import UploadService from '../../../services/UploadService.js';
import { CustomError, HttpStatusCodes, CommonResponse } from '../../../utils/helpers/index.js';
import path from 'path';
import fs from 'fs';

// Mocks
jest.mock('../../../services/UploadService.js');
jest.mock('fs');
jest.mock('path');

describe('UploadController', () => {
    let uploadController;
    let mockService;
    let mockReq;
    let mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        
        uploadController = new UploadController();
        mockService = new UploadService();
        uploadController.service = mockService;

        mockReq = {
            params: {},
            user: { _id: 'user123' },
            files: null,
            file: null
        };

        mockRes = {
            setHeader: jest.fn(),
            sendFile: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // Mock CommonResponse
        jest.spyOn(CommonResponse, 'created').mockReturnValue(mockRes);
        jest.spyOn(CommonResponse, 'success').mockReturnValue(mockRes);

        // Mock path methods globally
        path.extname.mockReturnValue('.jpg');
        path.basename.mockReturnValue('test.jpg');
        path.join.mockReturnValue('/test/path');
    });

    describe('_getContentType', () => {
        it('deve retornar content-type correto para extensões conhecidas', () => {
            path.extname.mockReturnValueOnce('.jpg');
            expect(uploadController._getContentType('image.jpg')).toBe('image/jpeg');
            
            path.extname.mockReturnValueOnce('.jpeg');
            expect(uploadController._getContentType('image.jpeg')).toBe('image/jpeg');
            
            path.extname.mockReturnValueOnce('.png');
            expect(uploadController._getContentType('image.png')).toBe('image/png');
            
            path.extname.mockReturnValueOnce('.gif');
            expect(uploadController._getContentType('image.gif')).toBe('image/gif');
            
            path.extname.mockReturnValueOnce('.webp');
            expect(uploadController._getContentType('image.webp')).toBe('image/webp');
            
            path.extname.mockReturnValueOnce('.svg');
            expect(uploadController._getContentType('image.svg')).toBe('image/svg+xml');
            
            path.extname.mockReturnValueOnce('.mp4');
            expect(uploadController._getContentType('video.mp4')).toBe('video/mp4');
            
            path.extname.mockReturnValueOnce('.webm');
            expect(uploadController._getContentType('video.webm')).toBe('video/webm');
            
            path.extname.mockReturnValueOnce('.ogg');
            expect(uploadController._getContentType('video.ogg')).toBe('video/ogg');
        });

        it('deve retornar content-type padrão para extensões desconhecidas', () => {
            path.extname.mockReturnValueOnce('.txt');
            expect(uploadController._getContentType('file.txt')).toBe('application/octet-stream');
            
            path.extname.mockReturnValueOnce('.unknown');
            expect(uploadController._getContentType('file.unknown')).toBe('application/octet-stream');
        });
    });

    describe('adicionarMidia', () => {
        beforeEach(() => {
            mockReq.params = { id: 'evento123', tipo: 'capa' };
        });

        it('deve adicionar mídia única com sucesso', async () => {
            mockReq.file = {
                filename: 'test-image.jpg',
                path: '/uploads/capa/test-image.jpg'
            };

            const mockResultado = { url: '/uploads/capa/test-image.jpg' };
            mockService.adicionarMidia.mockResolvedValue(mockResultado);

            await uploadController.adicionarMidia(mockReq, mockRes);

            expect(mockService.adicionarMidia).toHaveBeenCalledWith(
                'evento123',
                'capa',
                mockReq.file,
                'user123'
            );
            expect(CommonResponse.created).toHaveBeenCalledWith(
                mockRes,
                mockResultado,
                'Mídia (capa) salva com sucesso.'
            );
        });

        it('deve adicionar múltiplas mídias para carrossel', async () => {
            mockReq.params.tipo = 'carrossel';
            mockReq.files = [
                { filename: 'image1.jpg', path: '/uploads/carrossel/image1.jpg' },
                { filename: 'image2.jpg', path: '/uploads/carrossel/image2.jpg' }
            ];

            const mockResultado = { urls: ['/uploads/carrossel/image1.jpg', '/uploads/carrossel/image2.jpg'] };
            mockService.adicionarMultiplasMidias.mockResolvedValue(mockResultado);

            await uploadController.adicionarMidia(mockReq, mockRes);

            expect(mockService.adicionarMultiplasMidias).toHaveBeenCalledWith(
                'evento123',
                'carrossel',
                mockReq.files,
                'user123'
            );
            expect(CommonResponse.created).toHaveBeenCalledWith(
                mockRes,
                mockResultado,
                '2 arquivo(s) de carrossel salvos com sucesso.'
            );
        });

        it('deve lançar erro quando não há arquivo para tipo único', async () => {
            mockReq.file = null;

            await expect(uploadController.adicionarMidia(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando não há arquivos para carrossel', async () => {
            mockReq.params.tipo = 'carrossel';
            mockReq.files = [];

            await expect(uploadController.adicionarMidia(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });
    });

    describe('listarTodasMidias', () => {
        it('deve listar todas as mídias com sucesso', async () => {
            mockReq.params = { id: 'evento123' };
            const mockMidias = {
                midiaCapa: [{ url: '/uploads/capa/image.jpg' }],
                midiaVideo: [{ url: '/uploads/video/video.mp4' }],
                midiaCarrossel: [{ url: '/uploads/carrossel/image1.jpg' }]
            };

            mockService.listarTodasMidias.mockResolvedValue(mockMidias);

            await uploadController.listarTodasMidias(mockReq, mockRes);

            expect(mockService.listarTodasMidias).toHaveBeenCalledWith('evento123');
            expect(CommonResponse.success).toHaveBeenCalledWith(
                mockRes,
                mockMidias,
                200,
                'Mídias do evento retornadas com sucesso.'
            );
        });
    });

    describe('listarMidiaCapa', () => {
        beforeEach(() => {
            mockReq.params = { id: 'evento123' };
            // Mock path methods
            path.basename.mockReturnValue('image.jpg');
            path.join.mockReturnValue('/full/path/to/image.jpg');
            path.extname.mockReturnValue('.jpg');
        });

        it('deve retornar capa quando arquivo existir', async () => {
            const mockCapa = {
                midiaCapa: [{ url: '/uploads/capa/image.jpg' }]
            };

            mockService.listarMidiaCapa.mockResolvedValue(mockCapa);
            fs.existsSync.mockReturnValue(true);

            await uploadController.listarMidiaCapa(mockReq, mockRes);

            expect(mockService.listarMidiaCapa).toHaveBeenCalledWith('evento123');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
            expect(mockRes.sendFile).toHaveBeenCalled();
        });

        it('deve lançar erro quando não há capa', async () => {
            const mockCapa = { midiaCapa: [] };
            mockService.listarMidiaCapa.mockResolvedValue(mockCapa);

            await expect(uploadController.listarMidiaCapa(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando arquivo não existir no servidor', async () => {
            const mockCapa = {
                midiaCapa: [{ url: '/uploads/capa/image.jpg' }]
            };

            mockService.listarMidiaCapa.mockResolvedValue(mockCapa);
            fs.existsSync.mockReturnValue(false);

            await expect(uploadController.listarMidiaCapa(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });
    });

    describe('listarMidiaVideo', () => {
        beforeEach(() => {
            mockReq.params = { id: 'evento123' };
            path.basename.mockReturnValue('video.mp4');
            path.join.mockReturnValue('/full/path/to/video.mp4');
            path.extname.mockReturnValue('.mp4');
        });

        it('deve retornar vídeo quando arquivo existir', async () => {
            const mockVideo = {
                midiaVideo: [{ url: '/uploads/video/video.mp4' }]
            };

            mockService.listarMidiaVideo.mockResolvedValue(mockVideo);
            fs.existsSync.mockReturnValue(true);

            await uploadController.listarMidiaVideo(mockReq, mockRes);

            expect(mockService.listarMidiaVideo).toHaveBeenCalledWith('evento123');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'video/mp4');
            expect(mockRes.sendFile).toHaveBeenCalled();
        });

        it('deve lançar erro quando não há vídeo', async () => {
            const mockVideo = { midiaVideo: [] };
            mockService.listarMidiaVideo.mockResolvedValue(mockVideo);

            await expect(uploadController.listarMidiaVideo(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando arquivo não existir no servidor', async () => {
            const mockVideo = {
                midiaVideo: [{ url: '/uploads/video/video.mp4' }]
            };

            mockService.listarMidiaVideo.mockResolvedValue(mockVideo);
            fs.existsSync.mockReturnValue(false);

            await expect(uploadController.listarMidiaVideo(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });
    });

    describe('listarMidiaCarrossel', () => {
        beforeEach(() => {
            mockReq.params = { id: 'evento123', index: '0' };
            path.basename.mockReturnValue('image1.jpg');
            path.join.mockReturnValue('/full/path/to/image1.jpg');
            path.extname.mockReturnValue('.jpg');
        });

        it('deve retornar imagem do carrossel quando índice válido', async () => {
            const mockCarrossel = {
                midiaCarrossel: [
                    { url: '/uploads/carrossel/image1.jpg' },
                    { url: '/uploads/carrossel/image2.jpg' }
                ]
            };

            mockService.listarMidiaCarrossel.mockResolvedValue(mockCarrossel);
            fs.existsSync.mockReturnValue(true);

            await uploadController.listarMidiaCarrossel(mockReq, mockRes);

            expect(mockService.listarMidiaCarrossel).toHaveBeenCalledWith('evento123');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
            expect(mockRes.sendFile).toHaveBeenCalled();
        });

        it('deve lançar erro quando não há carrossel', async () => {
            const mockCarrossel = { midiaCarrossel: [] };
            mockService.listarMidiaCarrossel.mockResolvedValue(mockCarrossel);

            await expect(uploadController.listarMidiaCarrossel(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando índice for inválido', async () => {
            mockReq.params.index = '5';
            const mockCarrossel = {
                midiaCarrossel: [
                    { url: '/uploads/carrossel/image1.jpg' },
                    { url: '/uploads/carrossel/image2.jpg' }
                ]
            };

            mockService.listarMidiaCarrossel.mockResolvedValue(mockCarrossel);

            await expect(uploadController.listarMidiaCarrossel(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });

        it('deve tratar índice negativo como 0', async () => {
            mockReq.params.index = '-1';
            const mockCarrossel = {
                midiaCarrossel: [{ url: '/uploads/carrossel/image1.jpg' }]
            };

            mockService.listarMidiaCarrossel.mockResolvedValue(mockCarrossel);

            await expect(uploadController.listarMidiaCarrossel(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando arquivo não existir no servidor', async () => {
            const mockCarrossel = {
                midiaCarrossel: [{ url: '/uploads/carrossel/image1.jpg' }]
            };

            mockService.listarMidiaCarrossel.mockResolvedValue(mockCarrossel);
            fs.existsSync.mockReturnValue(false);

            await expect(uploadController.listarMidiaCarrossel(mockReq, mockRes))
                .rejects.toThrow(CustomError);
        });
    });

    describe('deletarMidia', () => {
        it('deve deletar mídia com sucesso', async () => {
            mockReq.params = {
                eventoId: 'evento123',
                tipo: 'capa',
                midiaId: 'midia456'
            };

            const mockEvento = { _id: 'evento123', midiaCapa: [] };
            mockService.deletarMidia.mockResolvedValue(mockEvento);

            await uploadController.deletarMidia(mockReq, mockRes);

            expect(mockService.deletarMidia).toHaveBeenCalledWith(
                'evento123',
                'capa',
                'midia456',
                'user123'
            );
            expect(CommonResponse.success).toHaveBeenCalledWith(
                mockRes,
                mockEvento,
                200,
                "Midia 'capa' do evento deletada com sucesso."
            );
        });
    });
});
