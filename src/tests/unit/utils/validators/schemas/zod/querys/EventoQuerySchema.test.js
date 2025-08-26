import { EventoIdSchema, EventoQuerySchema } from '../../../../../../../utils/validators/schemas/zod/querys/EventoQuerySchema.js';

describe('EventoQuerySchema', () => {
    describe('EventoIdSchema', () => {
        it('deve validar ID válido do MongoDB', () => {
            const validId = '64f5b8c8d1234567890abcde';
            const resultado = EventoIdSchema.safeParse(validId);

            expect(resultado.success).toBe(true);
            expect(resultado.data).toBe(validId);
        });

        it('deve rejeitar ID inválido', () => {
            const invalidId = 'invalid-id';
            const resultado = EventoIdSchema.safeParse(invalidId);

            expect(resultado.success).toBe(false);
            expect(resultado.error.issues[0].message).toBe('ID inválido');
        });

        it('deve rejeitar ID muito curto', () => {
            const shortId = '123';
            const resultado = EventoIdSchema.safeParse(shortId);

            expect(resultado.success).toBe(false);
            expect(resultado.error.issues[0].message).toBe('ID inválido');
        });

        it('deve rejeitar ID muito longo', () => {
            const longId = '64f5b8c8d1234567890abcdefghijk';
            const resultado = EventoIdSchema.safeParse(longId);

            expect(resultado.success).toBe(false);
            expect(resultado.error.issues[0].message).toBe('ID inválido');
        });
    });

    describe('EventoQuerySchema', () => {
        it('deve validar query vazia', () => {
            const query = {};
            const resultado = EventoQuerySchema.safeParse(query);

            expect(resultado.success).toBe(true);
            expect(resultado.data).toEqual({
                page: 1,
                limite: 10
            });
        });

        it('deve validar query com todos os campos válidos', () => {
            const query = {
                titulo: 'Evento Teste',
                descricao: 'Descrição do evento',
                local: 'Auditório Principal',
                categoria: 'Tecnologia',
                tags: 'javascript,nodejs,api',
                tipo: 'futuro',
                status: 'ativo',
                dataInicio: '2023-06-15',
                dataFim: '2023-06-16',
                page: '2',
                limite: '5'
            };

            const resultado = EventoQuerySchema.safeParse(query);

            expect(resultado.success).toBe(true);
            expect(resultado.data.titulo).toBe('Evento Teste');
            expect(resultado.data.descricao).toBe('Descrição do evento');
            expect(resultado.data.local).toBe('Auditório Principal');
            expect(resultado.data.categoria).toBe('Tecnologia');
            expect(resultado.data.tags).toEqual(['javascript', 'nodejs', 'api']);
            expect(resultado.data.tipo).toBe('futuro');
            expect(resultado.data.status).toBe('ativo');
            expect(resultado.data.dataInicio).toBe('2023-06-15');
            expect(resultado.data.dataFim).toBe('2023-06-16');
            expect(resultado.data.page).toBe(2);
            expect(resultado.data.limite).toBe(5);
        });

        describe('titulo', () => {
            it('deve aceitar título válido', () => {
                const query = { titulo: 'Evento Teste' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.titulo).toBe('Evento Teste');
            });

            it('deve fazer trim no título', () => {
                const query = { titulo: '  Evento Teste  ' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.titulo).toBe('Evento Teste');
            });

            it('deve aceitar título undefined', () => {
                const query = { titulo: undefined };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.titulo).toBeUndefined();
            });
        });

        describe('descricao', () => {
            it('deve aceitar descrição válida', () => {
                const query = { descricao: 'Descrição do evento' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.descricao).toBe('Descrição do evento');
            });

            it('deve fazer trim na descrição', () => {
                const query = { descricao: '  Descrição do evento  ' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.descricao).toBe('Descrição do evento');
            });
        });

        describe('local', () => {
            it('deve aceitar local válido', () => {
                const query = { local: 'Auditório Principal' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.local).toBe('Auditório Principal');
            });

            it('deve fazer trim no local', () => {
                const query = { local: '  Auditório Principal  ' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.local).toBe('Auditório Principal');
            });
        });

        describe('categoria', () => {
            it('deve aceitar categoria válida', () => {
                const query = { categoria: 'Tecnologia' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.categoria).toBe('Tecnologia');
            });

            it('deve fazer trim na categoria', () => {
                const query = { categoria: '  Tecnologia  ' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.categoria).toBe('Tecnologia');
            });
        });

        describe('tags', () => {
            it('deve processar tags como string separada por vírgula', () => {
                const query = { tags: 'javascript,nodejs,api' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.tags).toEqual(['javascript', 'nodejs', 'api']);
            });

            it('deve fazer trim nas tags', () => {
                const query = { tags: ' javascript , nodejs , api ' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.tags).toEqual(['javascript', 'nodejs', 'api']);
            });

            it('deve aceitar tags undefined', () => {
                const query = { tags: undefined };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.tags).toBeUndefined();
            });
        });

        describe('tipo', () => {
            it('deve aceitar tipo "historico"', () => {
                const query = { tipo: 'historico' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.tipo).toBe('historico');
            });

            it('deve aceitar tipo "futuro"', () => {
                const query = { tipo: 'futuro' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.tipo).toBe('futuro');
            });

            it('deve aceitar tipo "ativo"', () => {
                const query = { tipo: 'ativo' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.tipo).toBe('ativo');
            });

            it('deve rejeitar tipo inválido', () => {
                const query = { tipo: 'inválido' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(false);
                expect(resultado.error.issues[0].message).toBe("Tipo deve ser 'historico', 'futuro' ou 'ativo'");
            });

            it('deve aceitar tipo undefined', () => {
                const query = { tipo: undefined };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.tipo).toBeUndefined();
            });
        });

        describe('status', () => {
            it('deve aceitar status "ativo"', () => {
                const query = { status: 'ativo' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.status).toBe('ativo');
            });

            it('deve aceitar status "inativo"', () => {
                const query = { status: 'inativo' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.status).toBe('inativo');
            });

            it('deve rejeitar status inválido', () => {
                const query = { status: 'inválido' };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(false);
                expect(resultado.error.issues[0].message).toBe("Status deve ser 'ativo' ou 'inativo'");
            });

            it('deve aceitar status undefined', () => {
                const query = { status: undefined };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.status).toBeUndefined();
            });
        });

        describe('campos adicionais', () => {
            it('deve aceitar campos de data', () => {
                const query = {
                    dataInicio: '2023-06-15',
                    dataFim: '2023-06-16'
                };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.dataInicio).toBe('2023-06-15');
                expect(resultado.data.dataFim).toBe('2023-06-16');
                expect(resultado.data.page).toBe(1);
                expect(resultado.data.limite).toBe(10);
            });

            it('deve aceitar campos de paginação', () => {
                const query = {
                    page: '2',
                    limite: '5'
                };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data.page).toBe(2);
                expect(resultado.data.limite).toBe(5);
            });

            it('deve rejeitar valores inválidos de paginação', () => {
                const query = {
                    page: '0',
                    limite: '200'
                };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(false);
                expect(resultado.error.issues).toHaveLength(2);
            });

            it('deve rejeitar data inválida', () => {
                const query = {
                    dataInicio: 'data-inválida'
                };
                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(false);
                expect(resultado.error.issues[0].message).toBe('Data de início inválida');
            });
        });

        describe('validação de múltiplos campos', () => {
            it('deve validar query complexa', () => {
                const query = {
                    titulo: 'Evento de Tecnologia',
                    categoria: 'Tech',
                    tags: 'javascript,nodejs',
                    tipo: 'futuro',
                    status: 'ativo'
                };

                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(true);
                expect(resultado.data).toEqual({
                    titulo: 'Evento de Tecnologia',
                    categoria: 'Tech',
                    tags: ['javascript', 'nodejs'],
                    tipo: 'futuro',
                    status: 'ativo',
                    page: 1,
                    limite: 10
                });
            });

            it('deve rejeitar múltiplos campos inválidos', () => {
                const query = {
                    tipo: 'inválido',
                    status: 'inválido'
                };

                const resultado = EventoQuerySchema.safeParse(query);

                expect(resultado.success).toBe(false);
                expect(resultado.error.issues).toHaveLength(2);
                expect(resultado.error.issues[0].message).toBe("Tipo deve ser 'historico', 'futuro' ou 'ativo'");
                expect(resultado.error.issues[1].message).toBe("Status deve ser 'ativo' ou 'inativo'");
            });
        });
    });
});
