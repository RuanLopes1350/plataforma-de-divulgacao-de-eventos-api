// src/tests/unit/utils/validators/schemas/zod/EventoSchema.test.js

import { EventoSchema, EventoUpdateSchema } from '../../../../../../utils/validators/schemas/zod/EventoSchema.js';
import mongoose from 'mongoose';

describe('EventoSchema', () => {
    const midiaValida = {
        url: 'https://example.com/image.jpg',
        tamanhoMb: 2.5,
        altura: 720,
        largura: 1280,
    };

    const eventoValido = {
        titulo: 'Semana Nacional de Ciência e Tecnologia',
        descricao: 'Evento anual de ciência e tecnologia',
        local: 'Campus Vilhena',
        dataEvento: new Date(),
        organizador: {
            _id: new mongoose.Types.ObjectId().toString(),
            nome: 'Usuario de Teste',
        },
        linkInscricao: 'https://example.com/inscricao',
        tags: ['ciência', 'tecnologia'],
        categoria: 'evento',
        status: 'ativo',
        midiaVideo: [ midiaValida ],
        midiaCapa: [ midiaValida ],
        midiaCarrossel: [ midiaValida ],
    };

    it('deve validar um evento com todos os campos corretos', () => {
        const resultado = EventoSchema.safeParse(eventoValido);
        expect(resultado.success).toBe(true);
    });

    describe('Validação de campos obrigatórios', () => {
        const obrigatorios = [ 'titulo', 'descricao', 'local', 'dataEvento', 'organizador', 'linkInscricao', 'tags', 'categoria' ];

        obrigatorios.forEach(campo => {
            it(`deve falhar se o campo ${campo} não estiver presente`, () => {
                const eventoInvalido = { ...eventoValido };
                delete eventoInvalido[campo];
                const resultado = EventoSchema.safeParse(eventoInvalido);
                expect(resultado.success).toBe(false);
                expect(resultado.error.issues[0].path).toContain(campo);
            });
        });
    });

    it('deve falhar com URL inválido em linkInscricao', () => {
        const eventoInvalido = { ...eventoValido, linkInscricao: 'url-invalido' };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].message).toBe('Link de inscrição inválido');
    });

    it('deve falhar se tags for um array vazio', () => {
        const eventoInvalido = { ...eventoValido, tags: [] };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].message).toBe('Insira pelo menos uma tag');
    });

    it('deve falhar se o id do organizador for inválido', () => {
        const eventoInvalido = { ...eventoValido, organizador: { _id: '123', nome: 'Teste' } };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('organizador');
    });

    it('deve falhar se o nome do organizador for vazio', () => {
        const eventoInvalido = { ...eventoValido, organizador: { _id: new mongoose.Types.ObjectId().toString(), nome: '' } };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('organizador');
    });

    it('deve falhar com um tipo inválido na data do evento', () => {
        const eventoInvalido = { ...eventoValido, dataEvento: 'hoje' };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('dataEvento');
    });

    it('deve aceitar mídias vazias para eventos inativos', () => {
        const eventoComMidiasVazias = { 
            ...eventoValido, 
            status: 'inativo',
            midiaVideo: [],
            midiaCapa: [],
            midiaCarrossel: []
        };
        const resultado = EventoSchema.safeParse(eventoComMidiasVazias);
        expect(resultado.success).toBe(true);
    });

    it('deve falhar se evento ativo tiver mídias vazias', () => {
        const eventoAtivoSemMidias = { 
            ...eventoValido, 
            status: 'ativo',
            midiaVideo: [],
            midiaCapa: [],
            midiaCarrossel: []
        };
        const resultado = EventoSchema.safeParse(eventoAtivoSemMidias);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('midias');
    });

    it('deve falhar se uma mídia tiver campo inválido', () => {
        const  midiaInvalida = { ...midiaValida, url: 'inválido' };
        const eventoInvalido = { ...eventoValido, midiaCapa: [midiaInvalida] };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('midiaCapa');
    });

    it('deve falhar se o tamanho em mb da mídia for negativo', () => {
        const midiaInvalida = { ...midiaValida, tamanhoMb: -1 };
        const eventoInvalido = { ...eventoValido, midiaVideo: [midiaInvalida] };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('midiaVideo');
    });

    it('deve falhar se mídia tiver altura ou largura inválida', () => {
        const midiaInvalidaAltura = { ...midiaValida, altura: 0 };
        const midiaInvalidaLargura = { ...midiaValida, largura: 0 };

        const eventoAltura = { ...eventoValido, midiaCarrossel: [midiaInvalidaAltura] };
        const eventoLargura = { ...eventoValido, midiaCapa: [midiaInvalidaLargura] };

        const resultado1 = EventoSchema.safeParse(eventoAltura);
        const resultado2 = EventoSchema.safeParse(eventoLargura);

        expect(resultado1.success).toBe(false);
        expect(resultado2.success).toBe(false);
    });

    it('deve falhar se tags receberem uma string vazia', () => {
        const eventoInvalido = { ...eventoValido, tags: [''] };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('tags');
    });

    it('deve falhar se categoria for string vazia', () => {
        const eventoInvalido = { ...eventoValido, categoria: '' };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('categoria');
    });

    it('deve retornar os erros definidos no schema se vários campos forem inválidos', () => {
        const eventoInvalido = {
            ...eventoValido,
            titulo: '',
            linkInscricao: 'invalido',
            tags: [''],
        };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues.length).toBeGreaterThan(1);
    });

    describe('Validações de status', () => {
        it('deve falhar ao receber parâmetro diferente de "ativo" ou "inativo"', () => {
            const eventoInvalido = { ...eventoValido, status: 'teste' };
            const resultado = EventoSchema.safeParse(eventoInvalido);
            expect(resultado.success).toBe(false);
            expect(resultado.error.issues[0].path).toContain('status');
        });

        it('deve setar "inativo" como padrão se não fornecido', () => {
            const eventoSemStatus = { 
                ...eventoValido,
                status: undefined // Zod default só funciona com undefined, não com propriedade deletada
            };
            delete eventoSemStatus.status; // Remove a propriedade completamente
            const resultado = EventoSchema.safeParse(eventoSemStatus);
            expect(resultado.success).toBe(true);
            expect(resultado.data.status).toBe('inativo');
        });
    });

    it('deve aceitar URLs relativas válidas para mídias', () => {
        const midiaComUrlRelativa = {
            url: '/uploads/video/arquivo.mp4',
            tamanhoMb: 2.5,
            altura: 720,
            largura: 1280,
        };
        const eventoComUrlRelativa = { ...eventoValido, midiaVideo: [midiaComUrlRelativa] };
        const resultado = EventoSchema.safeParse(eventoComUrlRelativa);
        expect(resultado.success).toBe(true);
    });

    it('deve aceitar URLs completas para mídias', () => {
        const midiaComUrlCompleta = {
            url: 'https://example.com/video.mp4',
            tamanhoMb: 2.5,
            altura: 720,
            largura: 1280,
        };
        const eventoComUrlCompleta = { ...eventoValido, midiaVideo: [midiaComUrlCompleta] };
        const resultado = EventoSchema.safeParse(eventoComUrlCompleta);
        expect(resultado.success).toBe(true);
    });

    it('deve falhar se a URL da mídia for inválida', () => {
        const midiaInvalida = { ...midiaValida, url: 'url-inválida' };
        const eventoInvalido = { ...eventoValido, midiaCapa: [midiaInvalida] };
        const resultado = EventoSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('midiaCapa');
    });
});

describe('EventoUpdateSchema', () => {
    it('deve validar com sucesso todos os campos possíveis de update preenchidos corretamente', () => {
        const dadosUpdateValidos = {
            titulo: 'Novo Título do Evento Teste',
            descricao: 'Nova descrição do evento teste',
            local: 'Novo local teste',
            dataEvento: new Date(),
            organizador: {
                _id: new mongoose.Types.ObjectId().toString(),
                nome: 'Novo Nome do Organizador Teste',
            },
            linkInscricao: 'https://example.com/novo-link',
            tags: ['educação', 'inovação'],
            categoria: 'evento',
            status: 'inativo',
            midiaVideo: [
                {
                url: 'https://example.com/novo-video.mp4',
                tamanhoMb: 10,
                altura: 720,
                largura: 1280,
                }
            ],
            midiaCapa: [
                {
                url: 'https://example.com/nova-capa.jpg',
                tamanhoMb: 2.5,
                altura: 720,
                largura: 1280,
                }
            ],
            midiaCarrossel: [
                {
                url: 'https://example.com/nova-img.jpg',
                tamanhoMb: 1.2,
                altura: 720,
                largura: 1280,
                }
            ]
        };

        const resultado = EventoUpdateSchema.safeParse(dadosUpdateValidos);
        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining(dadosUpdateValidos));
    });

    it('deve aceitar qualquer campo parcial', () => {
        const dadosParciais = {
            titulo: 'Título Teste',
            tags: ['novo teste']
        };
        const resultado = EventoUpdateSchema.safeParse(dadosParciais);
        expect(resultado.success).toBe(true);
    });

    it('deve falhar com valores inválidos mesmo parcialmente', () => {
        const eventoInvalido = {
            linkInscricao: 'url-inválida'
        };
        const resultado = EventoUpdateSchema.safeParse(eventoInvalido);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('linkInscricao');
    });

    it('deve falhar ao atualizar com status inválido', () => {
        const dadoParcial = { status: 'desconhecido' };
        const resultado = EventoUpdateSchema.safeParse(dadoParcial);
        expect(resultado.success).toBe(false);
        expect(resultado.error.issues[0].path).toContain('status');
    });
});