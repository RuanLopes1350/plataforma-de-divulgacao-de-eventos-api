// src/tests/unit/models/Evento.test.js

import mongoose from "mongoose";
import Usuario from "../../../models/Usuario";
import Evento from "../../../models/Evento";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

// Configuração antes de todos os testes
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
        // Opções de conexão não são necessárias no Mongoose 6+
    });

    await mongoose.model('eventos').createIndexes();
});

// Limpeza após todos os testes
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Limpeza após cada teste para garantir isolamento
afterEach(async () => {
    jest.clearAllMocks();
    await Usuario.deleteMany({});
    await Evento.deleteMany({});
});

let eventDataTest;

// Cria um usuário de teste e define os dados base do evento antes de cada teste
beforeEach(async () => {
    let usuarioTeste = await Usuario.create({
        nome: "Usuário Teste",
        email: "testeUnit@gmail.com",
        senha: "SenhaTeste1@"
    });

    eventDataTest = {
        titulo: "Semana de Inovação Tecnológica",
        descricao: "Uma semana dedicada a palestras e workshops sobre inovação tecnológica.",
        local: "Auditório Principal",
        dataEvento: new Date("2025-05-25"),
        organizador: {
            _id: usuarioTeste._id,
            nome: usuarioTeste.nome
        },
        linkInscricao: "https://forms.gle/exemplo",
        eventoCriadoEm: new Date(),
        tags: ["Tecnologia", "Inovação"],
        categoria: "Tecnologia",
        status: "ativo",
        midiaVideo: [
            {
                _id: new mongoose.Types.ObjectId(),
                url: "/uploads/video/videoApresentativo.mp4",
                tamanhoMb: 12.3,
                altura: 720,
                largura: 1280,
            },
        ],
        midiaCapa: [
            {
                _id: new mongoose.Types.ObjectId(),
                url: "/uploads/capa/capaEvento.jpg",
                tamanhoMb: 2.5,
                altura: 720,
                largura: 1280,
            },
        ],
        midiaCarrossel: [
            {
                _id: new mongoose.Types.ObjectId(),
                url: "/uploads/carrossel/carrosselEvento1.jpg",
                tamanhoMb: 1.5,
                altura: 768,
                largura: 1024,
            },
            {
                _id: new mongoose.Types.ObjectId(),
                url: "/uploads/carrossel/carrosselEvento2.jpg",
                tamanhoMb: 1.8,
                altura: 768,
                largura: 1024,
            },
        ],
    };
});

describe('Modelo de Evento', () => {
    it('Deve criar um evento com dados válidos e referência ao usuário válida', async () => {
        const event = new Evento(eventDataTest);
        await event.save();

        const savedEvent = await Evento.findById(event._id);

        expect(savedEvent.titulo).toBe(eventDataTest.titulo);
        expect(savedEvent.descricao).toBe(eventDataTest.descricao);
        expect(savedEvent.local).toBe(eventDataTest.local);
        expect(savedEvent.dataEvento).toEqual(eventDataTest.dataEvento);
        expect(savedEvent.organizador._id.toString()).toBe(eventDataTest.organizador._id.toString());
        expect(savedEvent.organizador.nome).toBe(eventDataTest.organizador.nome);
        expect(savedEvent.linkInscricao).toBe(eventDataTest.linkInscricao);
        expect(savedEvent.eventoCriadoEm).toBeInstanceOf(Date);
        expect(savedEvent.tags).toEqual(expect.arrayContaining(eventDataTest.tags));
        expect(savedEvent.categoria).toBe(eventDataTest.categoria);
        expect(savedEvent.status).toBe(eventDataTest.status);
        expect(savedEvent.midiaVideo[0]).toMatchObject({
            url: eventDataTest.midiaVideo[0].url,
            tamanhoMb: eventDataTest.midiaVideo[0].tamanhoMb,
            altura: eventDataTest.midiaVideo[0].altura,
            largura: eventDataTest.midiaVideo[0].largura
        });
        expect(savedEvent.midiaCapa[0]).toMatchObject({
            url: eventDataTest.midiaCapa[0].url,
            tamanhoMb: eventDataTest.midiaCapa[0].tamanhoMb,
            altura: eventDataTest.midiaCapa[0].altura,
            largura: eventDataTest.midiaCapa[0].largura
        });
        expect(savedEvent.midiaCarrossel[0]).toMatchObject({
            url: eventDataTest.midiaCarrossel[0].url,
            tamanhoMb: eventDataTest.midiaCarrossel[0].tamanhoMb,
            altura: eventDataTest.midiaCarrossel[0].altura,
            largura: eventDataTest.midiaCarrossel[0].largura
        });
    });


    it('Deve permitir os valores válidos de status (ativo, inativo)', async () => {
        const statusValidos = ['ativo', 'inativo'];

        for (const status of statusValidos) {
            eventDataTest.status = status;
            const evento = await Evento.create(eventDataTest);
            expect(evento.status).toBe(status);
        }
    });

    
    it('Deve preencher campo eventoCriadoEm automaticamente', async () => {
        delete eventDataTest.eventoCriadoEm;
        const evento = await Evento.create(eventDataTest);

        expect(evento.eventoCriadoEm).toBeInstanceOf(Date);
    });


    it('Deve falhar ao criar evento sem titulo', async () => {
        delete eventDataTest.titulo;
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento sem descricao', async () => {
        delete eventDataTest.descricao;
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento sem local', async () => {
        delete eventDataTest.local;
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento sem dataEvento', async () => {
        delete eventDataTest.dataEvento;
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento sem organizador._id', async () => {
        delete eventDataTest.organizador._id;
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento sem organizador.nome', async () => {
        delete eventDataTest.organizador.nome;
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento sem linkInscricao', async () => {
        delete eventDataTest.linkInscricao;
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento sem tags', async () => {
        delete eventDataTest.tags;
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento sem categoria', async () => {
        delete eventDataTest.categoria;
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento com status inválido', async () => {
        eventDataTest.status = 'inexistente';
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrowErrorMatchingSnapshot();
    });


    it('Deve falhar ao criar evento com dataEvento inválida', async () => {
        eventDataTest.dataEvento = 'data-invalida';
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento com midiaVideo com tamanhoMb inválido', async () => {
        eventDataTest.midiaVideo = [{ url: 'https://example.com/v.mp4', tamanhoMb: 'grande', altura: 720, largura: 1280 }];
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento com midiaCapa sem url', async () => {
        eventDataTest.midiaCapa = [{ tamanhoMb: 2.5, altura: 720, largura: 1280 }];
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento com midiaCarrossel com campos inválidos', async () => {
        eventDataTest.midiaCarrossel = [{ tamanhoMb: 1.5, altura: 768, largura: 1024 }];
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento com midiaVideo vazia', async () => {
        eventDataTest.midiaVideo = [];
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve falhar ao criar evento com midiaCapa vazia', async () => {
        eventDataTest.midiaCapa = [];
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    })


    it('Deve falhar ao criar evento com midiaCarrossel vazia', async () => {
        eventDataTest.midiaCarrossel = [];
        const evento = new Evento(eventDataTest);
        await expect(evento.save()).rejects.toThrow();
    });


    it('Deve paginar eventos usando mongoose-paginate', async () => {
        for (let i = 0; i < 10; i++) {
            await Evento.create({ ...eventDataTest, titulo: `Evento ${i}` });
        };

        const resultado = await Evento.paginate({}, { limit: 5, page: 1 });
        expect(resultado.docs.length).toBeLessThanOrEqual(5);
        expect(resultado.totalDocs).toBeGreaterThanOrEqual(10);
    });
});