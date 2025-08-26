// /src/seeds/seedsEventos.js

import "dotenv/config";
import mongoose from "mongoose";

// Depêndencias
import { randomBytes as _randomBytes } from "crypto";

// Conexão com o banco
import DbConnect from "../config/DbConnect.js";

// Importação das Models
import Usuario from "../models/Usuario.js";
import Evento from "../models/Evento.js";

//Mapeador
import globalFakeMapping from "./globalFakeMapping.js";


// ----------------------------------------------------------------------------
// 1) Conectar ao banco de dados
// ----------------------------------------------------------------------------
await DbConnect.conectar();

// ----------------------------------------------------------------------------
// 2) SEED de Eventos
// ----------------------------------------------------------------------------

async function seedEventos(usuarios) {
    //Remove antes de criar os eventos
    await Evento.deleteMany();

    const eventosFixos = [
        {
            titulo: "Semana de Inovação Tecnológica",
            descricao: "Uma semana dedicada a palestras e workshops sobre inovação tecnológica.",
            local: "Auditório Principal",
            dataEvento: new Date("2025-05-25"),
            organizador: {
                _id: usuarios[0]._id,
                nome: usuarios[0].nome
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
                    altura: 720,
                    largura: 1280,
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    url: "/uploads/carrossel/carrosselEvento2.jpg",
                    tamanhoMb: 1.8,
                    altura: 720,
                    largura: 1280,
                },
            ],
        },
        {
            titulo: "Semana de Interclasse Ifro",
            descricao: "Semana de Interclasse do Ifro, com competições e atividades esportivas.",
            local: "Quadra Poliesportiva",
            dataEvento: new Date("2025-05-15"),
            organizador: {
                _id: usuarios[1]._id,
                nome: usuarios[1].nome
            },
            linkInscricao: "https://forms.gle/exemplo",
            eventoCriadoEm: new Date(),
            tags: ["Esporte", "Interclasse"],
            categoria: "Esportivo",
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
                    altura: 720,
                    largura: 1280,
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    url: "/uploads/carrossel/carrosselEvento2.jpg",
                    tamanhoMb: 1.8,
                    altura: 720,
                    largura: 1280,
                },
            ],
        }
    ];

    await Evento.collection.insertMany(eventosFixos);
    console.log(`${eventosFixos.length} Eventos fixos inseridos com sucesso!`);

    // Const que recebe o mapeamento global para ser usado na criação dos eventos aleatórios
    const mapping = await globalFakeMapping();

    // Gera eventos aleatórios
    const eventosAleatorios = [];

    for(let i = 0; i < 20; i++) {
        eventosAleatorios.push({
            titulo: mapping.titulo(),
            descricao: mapping.descricao(),
            local: mapping.local(),
            dataEvento: mapping.dataEvento(),
            organizador: {
                _id: usuarios[i]._id,
                nome: usuarios[i].nome
            },
            linkInscricao: mapping.linkInscricao(),
            eventoCriadoEm: mapping.eventoCriadoEm(),
            tags: mapping.tags(),
            categoria: mapping.categoria(),
            status: mapping.status(),
            midiaVideo: mapping.midiaVideo(),
            midiaCapa: mapping.midiaCapa(),
            midiaCarrossel: mapping.midiaCarrossel(),
        });
    };

    await Evento.collection.insertMany(eventosAleatorios);
    console.log(`${eventosAleatorios.length} Eventos aleatórios inseridos com sucesso!`);
}

export default seedEventos;