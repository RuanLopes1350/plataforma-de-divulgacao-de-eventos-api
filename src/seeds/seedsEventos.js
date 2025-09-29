// /src/seeds/seedsEventos.js

import "dotenv/config";
import mongoose from "mongoose";
import { v4 as uuid } from 'uuid';

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
// 2) SEED de Eventos (atualizado para o model atual)
// ----------------------------------------------------------------------------

function toStatusNumber(status) {
    if (status === 'ativo' || status === '1' || status === 1) return 1;
    return 0;
}

function unifyMidias(midiaVideo = [], midiaCapa = [], midiaCarrossel = []){
    const midias = [];
    midiaVideo.forEach(m => midias.push({ midiTipo: 'video', midiLink: m.url || m.urlVideo || m.midiLink }));
    midiaCapa.forEach(m => midias.push({ midiTipo: 'capa', midiLink: m.url || m.urlCapa || m.midiLink }));
    midiaCarrossel.forEach(m => midias.push({ midiTipo: 'carrossel', midiLink: m.url || m.midiLink }));
    return midias;
}

async function seedEventos(usuarios) {
    // Remove antes de criar os eventos
    await Evento.deleteMany();

    const eventosFixos = [
        {
            titulo: "Semana de Inovação Tecnológica",
            descricao: "Uma semana dedicada a palestras e workshops sobre inovação tecnológica.",
            local: "Auditório Principal",
            dataInicio: new Date("2025-05-25T09:00:00Z"),
            dataFim: new Date("2025-05-25T18:00:00Z"),
            organizador: {
                _id: usuarios[0]._id,
                nome: usuarios[0].nome
            },
            link: "https://forms.gle/exemplo",
            tags: "Tecnologia,Inovação",
            categoria: "academico",
            cor: 0,
            animacao: 0,
            status: 1,
            midia: [
                { midiTipo: 'capa', midiLink: '/uploads/capa/capaEvento.jpg' },
                { midiTipo: 'video', midiLink: '/uploads/video/videoApresentativo.mp4' },
                { midiTipo: 'carrossel', midiLink: '/uploads/carrossel/carrosselEvento1.jpg' }
            ],
            qrcode: { midiTipo: 'qrcode', midiLink: `/uploads/qrcode/${new mongoose.Types.ObjectId()}.png` },
            permissoes: [],
        },
        {
            titulo: "Semana de Interclasse Ifro",
            descricao: "Semana de Interclasse do Ifro, com competições e atividades esportivas.",
            local: "Quadra Poliesportiva",
            dataInicio: new Date("2025-05-15T08:00:00Z"),
            dataFim: new Date("2025-05-15T20:00:00Z"),
            organizador: {
                _id: usuarios[1]._id,
                nome: usuarios[1].nome
            },
            link: "https://forms.gle/exemplo",
            tags: "Esporte,Interclasse",
            categoria: "esportivo",
            cor: 0,
            animacao: 0,
            status: 1,
            midia: [
                { midiTipo: 'capa', midiLink: '/uploads/capa/capaEvento.jpg' },
                { midiTipo: 'video', midiLink: '/uploads/video/videoApresentativo.mp4' }
            ],
            qrcode: { midiTipo: 'qrcode', midiLink: `/uploads/qrcode/${new mongoose.Types.ObjectId()}.png` },
            permissoes: [],
        }
    ];

    await Evento.collection.insertMany(eventosFixos);
    console.log(`${eventosFixos.length} Eventos fixos inseridos com sucesso!`);

    // Const que recebe o mapeamento global para ser usado na criação dos eventos aleatórios
    const mapping = await globalFakeMapping();

    // Gera eventos aleatórios
    const eventosAleatorios = [];

    for(let i = 0; i < 20; i++) {
        const dataInicio = mapping.dataEvento();
        const dataFim = new Date(dataInicio.getTime() + (2 * 60 * 60 * 1000)); // +2h

        const midiaArr = unifyMidias(mapping.midiaVideo ? mapping.midiaVideo() : [], mapping.midiaCapa ? mapping.midiaCapa() : [], mapping.midiaCarrossel ? mapping.midiaCarrossel() : []);

        eventosAleatorios.push({
            titulo: mapping.titulo(),
            descricao: mapping.descricao(),
            local: mapping.local(),
            dataInicio,
            dataFim,
            organizador: {
                _id: usuarios[i % usuarios.length]._id,
                nome: usuarios[i % usuarios.length].nome
            },
            link: mapping.linkInscricao ? mapping.linkInscricao() : mapping.link || '',
            tags: Array.isArray(mapping.tags) ? mapping.tags() .join(',') : (mapping.tags ? mapping.tags() : ''),
            categoria: mapping.categoria ? mapping.categoria() : 'institucional',
            cor: 0,
            animacao: 0,
            status: toStatusNumber(mapping.status ? mapping.status() : 'inativo'),
            midia: midiaArr,
            qrcode: { midiTipo: 'qrcode', midiLink: `/uploads/qrcode/${uuid()}.png` },
            permissoes: mapping.permissoes ? mapping.permissoes() : [],
        });
    };

    if (eventosAleatorios.length > 0) {
        await Evento.collection.insertMany(eventosAleatorios);
        console.log(`${eventosAleatorios.length} Eventos aleatórios inseridos com sucesso!`);
    }
}

export default seedEventos;
