// /src/tests/unit/services/AuthService.test.js

import AuthService from '../../../services/AuthService.js';
import UsuarioRepository from '../../../repositories/UsuarioRepository.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CustomError, HttpStatusCodes } from '../../../utils/helpers/index.js';

// Mocks
jest.mock('../../../repositories/UsuarioRepository.js');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Mock do TokenUtil
const mockTokenUtil = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    generatePasswordRecoveryToken: jest.fn(),
    decodePasswordRecoveryToken: jest.fn()
};

describe('AuthService', () => {
    let authService;
    let mockRepository;

    beforeEach(() => {
        // Limpa todos os mocks antes de cada teste
        jest.clearAllMocks();
        
        // Injeta o TokenUtil mockado
        authService = new AuthService({ tokenUtil: mockTokenUtil });
        mockRepository = new UsuarioRepository();
        authService.repository = mockRepository;

        // Mock das variáveis de ambiente
        process.env.JWT_SECRET_REFRESH_TOKEN = 'test_refresh_secret';
        process.env.SINGLE_SESSION_REFRESH_TOKEN = 'false';
        process.env.JWT_SECRET_PASSWORD_RECOVERY = 'test_recovery_secret';
    });

    describe('carregatokens', () => {
        it('deve carregar tokens do usuário com sucesso', async () => {
            const userId = 'user123';
            const token = 'token123';
            const mockData = { _id: userId, refreshtoken: token };

            mockRepository.listarPorId.mockResolvedValue(mockData);

            const result = await authService.carregatokens(userId, token);

            expect(mockRepository.listarPorId).toHaveBeenCalledWith(userId, { includeTokens: true });
            expect(result).toEqual({ data: mockData });
        });
    });

    describe('logout', () => {
        it('deve fazer logout removendo tokens com sucesso', async () => {
            const userId = 'user123';
            const token = 'token123';
            const mockData = { success: true };

            mockRepository.removeToken.mockResolvedValue(mockData);

            const result = await authService.logout(userId, token);

            expect(mockRepository.removeToken).toHaveBeenCalledWith(userId);
            expect(result).toEqual({ data: mockData });
        });
    });

    describe('login', () => {
        const loginData = {
            email: 'test@example.com',
            senha: 'password123'
        };

        it('deve fazer login com sucesso', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                senha: 'hashedPassword',
                toObject: jest.fn().mockReturnValue({
                    _id: 'user123',
                    email: 'test@example.com',
                    nome: 'Test User'
                })
            };

            const mockUserWithTokens = {
                refreshtoken: 'existing_refresh_token'
            };

            mockRepository.buscarPorEmail
                .mockResolvedValueOnce(mockUser) // primeira chamada - validação
                .mockResolvedValueOnce(mockUser); // segunda chamada - retorno final

            mockRepository.listarPorId.mockResolvedValue(mockUserWithTokens);
            bcrypt.compare.mockResolvedValue(true);
            jwt.verify.mockReturnValue(true); // token válido
            mockTokenUtil.generateAccessToken.mockResolvedValue('new_access_token');
            mockRepository.armazenarTokens.mockResolvedValue(true);

            const result = await authService.login(loginData);

            expect(mockRepository.buscarPorEmail).toHaveBeenCalledWith(loginData.email);
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
            expect(mockTokenUtil.generateAccessToken).toHaveBeenCalledWith(mockUser._id);
            expect(result.user.accesstoken).toBe('new_access_token');
            expect(result.user.refreshtoken).toBe('existing_refresh_token');
        });

        it('deve lançar erro quando usuário não for encontrado', async () => {
            mockRepository.buscarPorEmail.mockResolvedValue(null);

            await expect(authService.login(loginData)).rejects.toThrow(CustomError);
            await expect(authService.login(loginData)).rejects.toThrow('Senha ou Email');
        });

        it('deve lançar erro quando senha for inválida', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                senha: 'hashedPassword'
            };

            mockRepository.buscarPorEmail.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.login(loginData)).rejects.toThrow(CustomError);
            await expect(authService.login(loginData)).rejects.toThrow('Senha ou Email');
        });

        it('deve gerar novo refresh token quando o existente estiver expirado', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                senha: 'hashedPassword',
                toObject: jest.fn().mockReturnValue({
                    _id: 'user123',
                    email: 'test@example.com'
                })
            };

            const mockUserWithTokens = {
                refreshtoken: 'expired_token'
            };

            mockRepository.buscarPorEmail
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(mockUser);
            mockRepository.listarPorId.mockResolvedValue(mockUserWithTokens);
            bcrypt.compare.mockResolvedValue(true);
            jwt.verify.mockImplementation(() => {
                const error = new Error('Token expirado');
                error.name = 'TokenExpiredError';
                throw error;
            });
            mockTokenUtil.generateAccessToken.mockResolvedValue('new_access_token');
            mockTokenUtil.generateRefreshToken.mockResolvedValue('new_refresh_token');
            mockRepository.armazenarTokens.mockResolvedValue(true);

            const result = await authService.login(loginData);

            expect(mockTokenUtil.generateRefreshToken).toHaveBeenCalledWith(mockUser._id);
            expect(result.user.refreshtoken).toBe('new_refresh_token');
        });

        it('deve gerar refresh token quando não existir', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                senha: 'hashedPassword',
                toObject: jest.fn().mockReturnValue({
                    _id: 'user123',
                    email: 'test@example.com'
                })
            };

            const mockUserWithTokens = {
                refreshtoken: null
            };

            mockRepository.buscarPorEmail
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(mockUser);
            mockRepository.listarPorId.mockResolvedValue(mockUserWithTokens);
            bcrypt.compare.mockResolvedValue(true);
            mockTokenUtil.generateAccessToken.mockResolvedValue('new_access_token');
            mockTokenUtil.generateRefreshToken.mockResolvedValue('new_refresh_token');
            mockRepository.armazenarTokens.mockResolvedValue(true);

            const result = await authService.login(loginData);

            expect(mockTokenUtil.generateRefreshToken).toHaveBeenCalledWith(mockUser._id);
            expect(result.user.refreshtoken).toBe('new_refresh_token');
        });
    });

    describe('recuperaSenha', () => {
        const emailData = { email: 'test@example.com' };

        it('deve gerar token de recuperação com sucesso', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                nome: 'Test User'
            };

            mockRepository.buscarPorEmail.mockResolvedValue(mockUser);
            mockTokenUtil.generatePasswordRecoveryToken.mockResolvedValue('recovery_token');
            mockRepository.alterar.mockResolvedValue(true);

            const result = await authService.recuperaSenha(emailData);

            expect(mockRepository.buscarPorEmail).toHaveBeenCalledWith(emailData.email);
            expect(mockTokenUtil.generatePasswordRecoveryToken).toHaveBeenCalledWith(mockUser._id);
            expect(mockRepository.alterar).toHaveBeenCalledWith(
                mockUser._id,
                expect.objectContaining({
                    tokenUnico: 'recovery_token'
                })
            );
            expect(result.message).toContain('recuperação de senha');
            expect(result.token).toBe('recovery_token');
        });

        it('deve lançar erro quando usuário não for encontrado', async () => {
            mockRepository.buscarPorEmail.mockResolvedValue(null);

            await expect(authService.recuperaSenha(emailData)).rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando falhar ao atualizar usuário', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                nome: 'Test User'
            };

            mockRepository.buscarPorEmail.mockResolvedValue(mockUser);
            mockTokenUtil.generatePasswordRecoveryToken.mockResolvedValue('recovery_token');
            mockRepository.alterar.mockResolvedValue(null);

            await expect(authService.recuperaSenha(emailData)).rejects.toThrow(CustomError);
        });
    });

    describe('atualizarSenhaToken', () => {
        const tokenRecuperacao = 'recovery_token';
        const senhaBody = { senha: 'newPassword123' };

        it('deve atualizar senha com token válido', async () => {
            const mockUser = {
                _id: 'user123',
                tokenUnico: tokenRecuperacao,
                exp_tokenUnico_recuperacao: new Date(Date.now() + 3600000) // 1 hora no futuro
            };

            mockTokenUtil.decodePasswordRecoveryToken.mockResolvedValue('user123');
            mockRepository.buscarPorTokenUnico.mockResolvedValue(mockUser);
            mockRepository.atualizarSenha.mockResolvedValue(true);

            // Mock do AuthHelper.hashPassword
            const AuthHelper = await import('../../../utils/AuthHelper.js');
            jest.spyOn(AuthHelper.default, 'hashPassword').mockResolvedValue('hashedNewPassword');

            const result = await authService.atualizarSenhaToken(tokenRecuperacao, senhaBody);

            expect(mockTokenUtil.decodePasswordRecoveryToken).toHaveBeenCalledWith(
                tokenRecuperacao,
                'test_recovery_secret'
            );
            expect(mockRepository.buscarPorTokenUnico).toHaveBeenCalledWith(tokenRecuperacao);
            expect(AuthHelper.default.hashPassword).toHaveBeenCalledWith(senhaBody.senha);
            expect(mockRepository.atualizarSenha).toHaveBeenCalledWith('user123', 'hashedNewPassword');
            expect(result.message).toBe('Senha atualizada com sucesso.');
        });

        it('deve lançar erro quando token não for encontrado', async () => {
            mockTokenUtil.decodePasswordRecoveryToken.mockResolvedValue('user123');
            mockRepository.buscarPorTokenUnico.mockResolvedValue(null);

            await expect(authService.atualizarSenhaToken(tokenRecuperacao, senhaBody))
                .rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando token estiver expirado', async () => {
            const mockUser = {
                _id: 'user123',
                tokenUnico: tokenRecuperacao,
                exp_tokenUnico_recuperacao: new Date(Date.now() - 3600000) // 1 hora no passado
            };

            mockTokenUtil.decodePasswordRecoveryToken.mockResolvedValue('user123');
            mockRepository.buscarPorTokenUnico.mockResolvedValue(mockUser);

            await expect(authService.atualizarSenhaToken(tokenRecuperacao, senhaBody))
                .rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando falhar ao atualizar senha', async () => {
            const mockUser = {
                _id: 'user123',
                tokenUnico: tokenRecuperacao,
                exp_tokenUnico_recuperacao: new Date(Date.now() + 3600000)
            };

            mockTokenUtil.decodePasswordRecoveryToken.mockResolvedValue('user123');
            mockRepository.buscarPorTokenUnico.mockResolvedValue(mockUser);
            mockRepository.atualizarSenha.mockResolvedValue(null);

            const AuthHelper = await import('../../../utils/AuthHelper.js');
            jest.spyOn(AuthHelper.default, 'hashPassword').mockResolvedValue('hashedNewPassword');

            await expect(authService.atualizarSenhaToken(tokenRecuperacao, senhaBody))
                .rejects.toThrow(CustomError);
        });
    });

    describe('refresh', () => {
        const userId = 'user123';
        const token = 'valid_refresh_token';

        it('deve renovar tokens com sucesso', async () => {
            const mockUser = {
                _id: userId,
                refreshtoken: token,
                toObject: jest.fn().mockReturnValue({
                    _id: userId,
                    email: 'test@example.com'
                })
            };

            mockRepository.listarPorId
                .mockResolvedValueOnce(mockUser) // primeira chamada - validação
                .mockResolvedValueOnce(mockUser); // segunda chamada - retorno final

            mockTokenUtil.generateAccessToken.mockResolvedValue('new_access_token');
            mockRepository.armazenarTokens.mockResolvedValue(true);

            const result = await authService.refresh(userId, token);

            expect(mockRepository.listarPorId).toHaveBeenCalledWith(userId, { includeTokens: true });
            expect(mockTokenUtil.generateAccessToken).toHaveBeenCalledWith(userId);
            expect(result.user.accesstoken).toBe('new_access_token');
            expect(result.user.refreshtoken).toBe(token); // mantém o mesmo refresh token
        });

        it('deve gerar novo refresh token quando SINGLE_SESSION_REFRESH_TOKEN for true', async () => {
            process.env.SINGLE_SESSION_REFRESH_TOKEN = 'true';

            const mockUser = {
                _id: userId,
                refreshtoken: token,
                toObject: jest.fn().mockReturnValue({
                    _id: userId,
                    email: 'test@example.com'
                })
            };

            mockRepository.listarPorId
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce(mockUser);

            mockTokenUtil.generateAccessToken.mockResolvedValue('new_access_token');
            mockTokenUtil.generateRefreshToken.mockResolvedValue('new_refresh_token');
            mockRepository.armazenarTokens.mockResolvedValue(true);

            const result = await authService.refresh(userId, token);

            expect(mockTokenUtil.generateRefreshToken).toHaveBeenCalledWith(userId);
            expect(result.user.refreshtoken).toBe('new_refresh_token');
        });

        it('deve lançar erro quando usuário não for encontrado', async () => {
            mockRepository.listarPorId.mockResolvedValue(null);

            await expect(authService.refresh(userId, token)).rejects.toThrow(CustomError);
        });

        it('deve lançar erro quando token não coincidir', async () => {
            const mockUser = {
                _id: userId,
                refreshtoken: 'different_token'
            };

            mockRepository.listarPorId.mockResolvedValue(mockUser);

            await expect(authService.refresh(userId, token)).rejects.toThrow(CustomError);
        });
    });
});
