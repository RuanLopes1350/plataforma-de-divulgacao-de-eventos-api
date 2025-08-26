// src/tests/unit/models/Usuario.test.js

import mongoose from "mongoose";
import Usuario from "../../../models/Usuario";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

// Configuração antes de todos os testes
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, {
        // Opções de conexão não são necessárias no Mongoose 6+
    });

    await mongoose.model('usuarios').createIndexes();
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
});

let userDataTest;

// Define os dados base do usuário antes de cada teste
beforeEach(() => {
    userDataTest = {
        nome: "Usuário Teste",
        email: "testeUnit@gmail.com",
        senha: "SenhaTeste1@"
    };
});

describe('Modelo de Usuário', () => {
    it('Deve criar um usuário com dados válidos', async () => {
        const user = new Usuario(userDataTest);
        await user.save();

        const savedUser = await Usuario.findById(user._id);

        expect(savedUser.nome).toBe(userDataTest.nome);
        expect(savedUser.email).toBe(userDataTest.email);
        expect(savedUser.senha).not.toBe(userDataTest.senha);
        expect(savedUser.createdAt).toBeInstanceOf(Date);
        expect(savedUser.updatedAt).toBeInstanceOf(Date);
    });

    it('Deve preencher campos createdAt e updatedAt automaticamente', async () => {
        const user = await Usuario.create(userDataTest);

        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('Deve falhar ao criar usuário sem nome', async () => {
        delete userDataTest.nome;
        const user = new Usuario(userDataTest);
        await expect(user.save()).rejects.toThrow();
    });

    it('Deve falhar ao criar usuário sem senha', async () => {
        delete userDataTest.senha;
        const user = new Usuario(userDataTest);
        await expect(user.save()).rejects.toThrow();
    });

    it('Deve criar índice para nome', async () => {
        const indexes = await Usuario.collection.indexInformation();
        expect(indexes).toHaveProperty('nome_1');
        expect(indexes.nome_1[0]).toEqual(['nome', 1]);
    });

    it('Deve paginar usuários usando mongoose-paginate', async () => {
        // Cria vários usuários de teste
        for (let i = 0; i < 10; i++) {
            await Usuario.create({ 
                ...userDataTest, 
                email: `testeUnitUser${i}@gmail.com`,
                nome: `Usuário Teste ${i}`
            });
        }

        const resultado = await Usuario.paginate({}, { limit: 5, page: 1 });
        expect(resultado.docs.length).toBe(5);
        expect(resultado.totalDocs).toBe(10);
        expect(resultado.totalPages).toBe(2);
    });

    it("Deve criar um usuário com status padrão 'ativo'", async () => {
        const user = new Usuario(userDataTest);
        await user.save();

        const savedUser = await Usuario.findById(user._id);

        expect(savedUser.status).toBe("ativo");
    });

    it("Deve criar um usuário com status 'inativo'", async () => {
        const user = new Usuario({ ...userDataTest, status: "inativo" });
        await user.save();

        const savedUser = await Usuario.findById(user._id);

        expect(savedUser.status).toBe("inativo");
    });

    it("Deve falhar ao criar um usuário com status inválido", async () => {
        const user = new Usuario({ ...userDataTest, status: "indefinido" });
        await expect(user.save()).rejects.toThrow();
    });
});