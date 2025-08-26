// src/tests/unit/middleware/LogRoutesMiddleware.test.js

import logRoutes from '../../../middlewares/LogRoutesMiddleware';

describe('LogRoutesMiddleware', () => {
    let req, res, next, consoleSpy;

    beforeEach(() => {
        req = {
            method: 'GET',
            protocol: 'http',
            get: jest.fn().mockReturnValue('example.com'),
            originalUrl: '/api/test',
            headers: {},
            socket: {
                remoteAddress: '127.0.0.1'
            }
        };

        res = {};
        next = jest.fn();
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    it('deve registrar informações da requisição e chamar next()', async () => {
        await logRoutes(req, res, next);

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringMatching(/.*127\.0\.0\.1.*GET.*http:\/\/example\.com\/api\/test.*/)
        );

        expect(next).toHaveBeenCalled();
    });

    it('deve usar o IP do cabeçalho x-forwarded-for quando disponível', async () => {
        req.headers['x-forwarded-for'] = '192.168.1.1';

        await logRoutes(req, res, next);

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringMatching(/.*192\.168\.1\.1.*/)
        );
        expect(next).toHaveBeenCalled();
    });

    it('deve lidar com erro na geração do log e ainda chamar next()', async () => {
        delete req.get;
        const errorSpy = jest.spyOn(console, 'log');

        await logRoutes(req, res, next);

        expect(errorSpy).toHaveBeenCalledWith(
            'Erro ao fazer o log',
            expect.any(Error)
        );

        expect(next).toHaveBeenCalled();
    });

    it('deve usar valor null quando não há IP disponível', async () => {
        delete req.headers['x-forwarded-for'];
        delete req.socket.remoteAddress;
        
        await logRoutes(req, res, next);

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringMatching(/.*null.*GET.*http:\/\/example\.com\/api\/test.*/)
        );
        
        expect(next).toHaveBeenCalled();
    });
});