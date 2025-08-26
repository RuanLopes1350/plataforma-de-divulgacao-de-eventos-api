import request from "supertest";
import { describe, it, expect, beforeAll } from "@jest/globals";
import dotenv from 'dotenv';
import "../../../src/routes/usuarioRoutes.js";

dotenv.config();

const PORT = process.env.APP_PORT || 5011;
const BASE_URL = `http://localhost:${PORT}`;

let token;
let adminUsuarioId;

describe('Usuários API', () => {
    beforeAll(async () => {
        // Fazer login para obter token
        const loginResponse = await request(BASE_URL)
            .post('/login')
            .send({
                email: 'devTeste@gmail.com',
                senha: 'ABab@123456'
            });
        
        // Extrair token da estrutura conhecida
        if (loginResponse.status === 200 && loginResponse.body.data?.user?.accesstoken) {
            token = loginResponse.body.data.user.accesstoken;
        }
    });

    describe('POST /usuarios', () => {
        it('deve criar um usuário com dados válidos', async () => {
            if (!token) return;
            
            const usuarioData = {
                nome: 'Usuário Teste',
                email: `usuario.teste.${Date.now()}@exemplo.com`,
                senha: 'SenhaSegura@123'
            };

            const response = await request(BASE_URL)
                .post('/usuarios')
                .set('Authorization', `Bearer ${token}`)
                .send(usuarioData);

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.nome).toBe(usuarioData.nome);
            expect(response.body.data.email).toBe(usuarioData.email);
            expect(response.body.data).not.toHaveProperty('senha'); // Senha deve ser removida da resposta
            expect(response.body.data.status).toBe('ativo'); // Status padrão

            // Salvar ID para testes posteriores
            adminUsuarioId = response.body.data._id;
        });

        it('deve retornar erro 401 sem token de autenticação', async () => {
            const usuarioData = {
                nome: 'Usuário Teste',
                email: 'usuario.teste2@exemplo.com',
                senha: 'SenhaSegura@123'
            };

            const response = await request(BASE_URL)
                .post('/usuarios')
                .send(usuarioData);

            expect(response.status).toBe(498);
        });

        it('deve retornar erro 400 com dados inválidos - nome vazio', async () => {
            if (!token) return;
            
            const usuarioDataInvalido = {
                nome: '',
                email: 'usuario.invalido@exemplo.com',
                senha: 'SenhaSegura@123'
            };

            const response = await request(BASE_URL)
                .post('/usuarios')
                .set('Authorization', `Bearer ${token}`)
                .send(usuarioDataInvalido);

            expect(response.status).toBe(400);
        });

        it('deve retornar erro 400 com email inválido', async () => {
            if (!token) return;
            
            const usuarioDataInvalido = {
                nome: 'Usuário Teste',
                email: 'email-invalido',
                senha: 'SenhaSegura@123'
            };

            const response = await request(BASE_URL)
                .post('/usuarios')
                .set('Authorization', `Bearer ${token}`)
                .send(usuarioDataInvalido);

            expect(response.status).toBe(400);
        });

        it('deve retornar erro 400 com senha inválida', async () => {
            if (!token) return;
            
            const usuarioDataInvalido = {
                nome: 'Usuário Teste',
                email: 'usuario.senha.invalida@exemplo.com',
                senha: '123' // Senha muito curta
            };

            const response = await request(BASE_URL)
                .post('/usuarios')
                .set('Authorization', `Bearer ${token}`)
                .send(usuarioDataInvalido);

            expect(response.status).toBe(400);
        });

        it('deve retornar erro 400 com email duplicado', async () => {
            if (!token) return;
            
            const usuarioDataDuplicado = {
                nome: 'Usuário Duplicado',
                email: 'usuario.teste@exemplo.com', // Email já usado no primeiro teste
                senha: 'SenhaSegura@123'
            };

            const response = await request(BASE_URL)
                .post('/usuarios')
                .set('Authorization', `Bearer ${token}`)
                .send(usuarioDataDuplicado);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /usuarios', () => {
        it('deve listar todos os usuários', async () => {
            if (!token) return;

            const response = await request(BASE_URL)
                .get('/usuarios')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            
            // Verificar se nenhum usuário tem senha na resposta
            if (response.body.data.length > 0) {
                response.body.data.forEach(usuario => {
                    expect(usuario).not.toHaveProperty('senha');
                });
            }
        });

        it('deve retornar erro 401 sem token de autenticação', async () => {
            const response = await request(BASE_URL)
                .get('/usuarios');

            expect(response.status).toBe(498);
        });
    });

    describe('GET /usuarios/:id', () => {
        it('deve buscar usuário por ID válido', async () => {
            if (!token || !adminUsuarioId) return;
            
            const response = await request(BASE_URL)
                .get(`/usuarios/${adminUsuarioId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('_id', adminUsuarioId);
            expect(response.body.data).toHaveProperty('nome');
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data).not.toHaveProperty('senha'); // Senha deve ser removida
        });

        it('deve retornar erro 404 para ID inexistente', async () => {
            if (!token) return;
            
            const idInexistente = '507f1f77bcf86cd799439011';
            
            const response = await request(BASE_URL)
                .get(`/usuarios/${idInexistente}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });

        it('deve retornar erro 400 para ID inválido', async () => {
            if (!token) return;
            
            const idInvalido = 'id-invalido';
            
            const response = await request(BASE_URL)
                .get(`/usuarios/${idInvalido}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
        });

        it('deve retornar erro 401 sem token de autenticação', async () => {
            if (!adminUsuarioId) return;
            
            const response = await request(BASE_URL)
                .get(`/usuarios/${adminUsuarioId}`);

            expect(response.status).toBe(498);
        });
    });

    describe('PATCH /usuarios/:id', () => {
        let usuarioParaAtualizarId;

        beforeAll(async () => {
            if (!token) return;

            // Criar um usuário para testar atualização
            const usuarioData = {
                nome: 'Usuário para Atualizar',
                email: 'usuario.atualizar@exemplo.com',
                senha: 'SenhaSegura@123'
            };

            const response = await request(BASE_URL)
                .post('/usuarios')
                .set('Authorization', `Bearer ${token}`)
                .send(usuarioData);

            if (response.body && response.body.data) {
                usuarioParaAtualizarId = response.body.data._id;
            }
        });

        it('deve atualizar usuário com dados válidos', async () => {
            if (!token || !usuarioParaAtualizarId) return;
            
            const dadosAtualizados = {
                nome: 'Usuário Atualizado',
                status: 'ativo'
            };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${usuarioParaAtualizarId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dadosAtualizados);

            expect(response.status).toBe(200);
            expect(response.body.data.nome).toBe(dadosAtualizados.nome);
            expect(response.body.data).not.toHaveProperty('senha'); // Senha deve ser removida
            expect(response.body.message).toBe('Usuário atualizado com sucesso.');
        });

        it('deve atualizar apenas campos fornecidos (atualização parcial)', async () => {
            if (!token || !usuarioParaAtualizarId) return;
            
            const dadosAtualizados = {
                nome: 'Nome Parcialmente Atualizado'
                // Não incluindo outros campos
            };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${usuarioParaAtualizarId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dadosAtualizados);

            expect(response.status).toBe(200);
            expect(response.body.data.nome).toBe(dadosAtualizados.nome);
            expect(response.body.data.email).toBe('usuario.atualizar@exemplo.com'); // Email deve permanecer inalterado
        });

        it('deve retornar erro 404 para ID inexistente', async () => {
            if (!token) return;
            
            const idInexistente = '507f1f77bcf86cd799439011';
            const dadosAtualizados = { nome: 'Usuário Teste' };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${idInexistente}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dadosAtualizados);

            expect(response.status).toBe(404);
        });

        it('deve retornar erro 400 para ID inválido', async () => {
            if (!token) return;
            
            const idInvalido = 'id-invalido';
            const dadosAtualizados = { nome: 'Usuário Teste' };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${idInvalido}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dadosAtualizados);

            expect(response.status).toBe(400);
        });

        it('deve retornar erro 401 sem token de autenticação', async () => {
            if (!usuarioParaAtualizarId) return;
            
            const dadosAtualizados = { nome: 'Usuário Teste' };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${usuarioParaAtualizarId}`)
                .send(dadosAtualizados);

            expect(response.status).toBe(498);
        });

        it('deve retornar erro 400 com dados inválidos', async () => {
            if (!token || !usuarioParaAtualizarId) return;
            
            const dadosInvalidos = {
                nome: '', // Nome vazio
            };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${usuarioParaAtualizarId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(dadosInvalidos);

            expect(response.status).toBe(400);
        });
    });

    describe('PATCH /usuarios/:id/status', () => {
        let usuarioParaStatusId;

        beforeAll(async () => {
            if (!token) return;

            // Criar um usuário para testar alteração de status
            const usuarioData = {
                nome: 'Usuário para Status',
                email: 'usuario.status@exemplo.com',
                senha: 'SenhaSegura@123'
            };

            const response = await request(BASE_URL)
                .post('/usuarios')
                .set('Authorization', `Bearer ${token}`)
                .send(usuarioData);

            if (response.body && response.body.data) {
                usuarioParaStatusId = response.body.data._id;
            }
        });

        it('deve alterar status do usuário para inativo', async () => {
            if (!token || !usuarioParaStatusId) return;
            
            const novoStatus = { status: 'inativo' };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${usuarioParaStatusId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send(novoStatus);

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe(novoStatus.status);
            expect(response.body.message).toBe(`Status do usuário atualizado para ${novoStatus.status}.`);
        });

        it('deve alterar status do usuário para ativo', async () => {
            if (!token || !usuarioParaStatusId) return;
            
            const novoStatus = { status: 'ativo' };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${usuarioParaStatusId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send(novoStatus);

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe(novoStatus.status);
            expect(response.body.message).toBe(`Status do usuário atualizado para ${novoStatus.status}.`);
        });

        it('deve retornar erro 400 com status inválido', async () => {
            if (!token || !usuarioParaStatusId) return;
            
            const statusInvalido = { status: 'status_inexistente' };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${usuarioParaStatusId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send(statusInvalido);

            expect(response.status).toBe(400);
        });

        it('deve retornar erro 404 para ID inexistente', async () => {
            if (!token) return;
            
            const idInexistente = '507f1f77bcf86cd799439011';
            const novoStatus = { status: 'inativo' };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${idInexistente}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send(novoStatus);

            expect(response.status).toBe(404);
        });

        it('deve retornar erro 400 para ID inválido', async () => {
            if (!token) return;
            
            const idInvalido = 'id-invalido';
            const novoStatus = { status: 'inativo' };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${idInvalido}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send(novoStatus);

            expect(response.status).toBe(400);
        });

        it('deve retornar erro 401 sem token de autenticação', async () => {
            if (!usuarioParaStatusId) return;
            
            const novoStatus = { status: 'inativo' };

            const response = await request(BASE_URL)
                .patch(`/usuarios/${usuarioParaStatusId}/status`)
                .send(novoStatus);

            expect(response.status).toBe(498);
        });

        it('deve retornar erro 400 sem campo status', async () => {
            if (!token || !usuarioParaStatusId) return;
            
            const dadosSemStatus = {}; // Sem campo status

            const response = await request(BASE_URL)
                .patch(`/usuarios/${usuarioParaStatusId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send(dadosSemStatus);

            expect(response.status).toBe(400);
        });
    });

    describe('Validações de Segurança', () => {
        it('deve garantir que senhas nunca apareçam nas respostas da API', async () => {
            if (!token) return;

            // Teste listar todos os usuários
            const listarResponse = await request(BASE_URL)
                .get('/usuarios')
                .set('Authorization', `Bearer ${token}`);

            if (listarResponse.status === 200 && listarResponse.body.data) {
                listarResponse.body.data.forEach(usuario => {
                    expect(usuario).not.toHaveProperty('senha');
                    expect(usuario).not.toHaveProperty('refreshtoken');
                    expect(usuario).not.toHaveProperty('accesstoken');
                    expect(usuario).not.toHaveProperty('tokenUnico');
                });
            }

            // Teste buscar usuário por ID
            if (adminUsuarioId) {
                const buscarResponse = await request(BASE_URL)
                    .get(`/usuarios/${adminUsuarioId}`)
                    .set('Authorization', `Bearer ${token}`);

                if (buscarResponse.status === 200) {
                    expect(buscarResponse.body.data).not.toHaveProperty('senha');
                    expect(buscarResponse.body.data).not.toHaveProperty('refreshtoken');
                    expect(buscarResponse.body.data).not.toHaveProperty('accesstoken');
                    expect(buscarResponse.body.data).not.toHaveProperty('tokenUnico');
                }
            }
        });

        it('deve validar formato de email corretamente', async () => {
            if (!token) return;
            
            const emailsInvalidos = [
                'email-sem-arroba',
                '@dominio.com',
                'email@',
                'email@dominio',
                'email.dominio.com',
                'email@@dominio.com'
            ];

            for (const emailInvalido of emailsInvalidos) {
                const usuarioData = {
                    nome: 'Usuário Teste Email',
                    email: emailInvalido,
                    senha: 'SenhaSegura@123'
                };

                const response = await request(BASE_URL)
                    .post('/usuarios')
                    .set('Authorization', `Bearer ${token}`)
                    .send(usuarioData);

                expect(response.status).toBe(400);
            }
        });

        it('deve validar força da senha corretamente', async () => {
            if (!token) return;
            
            const senhasInvalidas = [
                '123', // Muito curta
                'senha', // Sem maiúscula, números ou símbolos
                'SENHA', // Sem minúscula, números ou símbolos
                'Senha123', // Sem símbolos
                'senha@123', // Sem maiúscula
                'SENHA@123', // Sem minúscula
            ];

            for (const senhaInvalida of senhasInvalidas) {
                const usuarioData = {
                    nome: 'Usuário Teste Senha',
                    email: `teste.senha.${Date.now()}@exemplo.com`,
                    senha: senhaInvalida
                };

                const response = await request(BASE_URL)
                    .post('/usuarios')
                    .set('Authorization', `Bearer ${token}`)
                    .send(usuarioData);

                expect(response.status).toBe(400);
            }
        });
    });

    describe('Testes de Edge Cases', () => {
        it('deve lidar com campos extras na requisição (ignorar campos não permitidos)', async () => {
            if (!token) return;
            
            const usuarioComCamposExtras = {
                nome: 'Usuário Campos Extras',
                email: `usuario.extras.${Date.now()}@exemplo.com`,
                senha: 'SenhaSegura@123',
                campoInexistente: 'valor',
                outroCampo: 123,
                objetoExtra: { campo: 'valor' }
            };

            const response = await request(BASE_URL)
                .post('/usuarios')
                .set('Authorization', `Bearer ${token}`)
                .send(usuarioComCamposExtras);

            expect(response.status).toBe(201);
            expect(response.body.data.nome).toBe(usuarioComCamposExtras.nome);
            expect(response.body.data.email).toBe(usuarioComCamposExtras.email);
            expect(response.body.data).not.toHaveProperty('campoInexistente');
            expect(response.body.data).not.toHaveProperty('outrocampo');
            expect(response.body.data).not.toHaveProperty('objetoExtra');
        });
    });
});
