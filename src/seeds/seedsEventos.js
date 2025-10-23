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
import getGlobalFakeMapping from "./globalFakeMapping.js";

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

function unifyMidias(midiaVideo = [], midiaCapa = [], midiaCarrossel = []) {
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
            titulo: "II Hackathon IFRO de Inovação",
            descricao: "Maratona de programação de 48 horas focada em desenvolver soluções inovadoras para desafios locais. Aberto a todos os alunos dos cursos de tecnologia.",
            local: "Laboratório de Informática 05",
            dataInicio: new Date("2025-11-08T09:00:00Z"),
            dataFim: new Date("2025-11-10T18:00:00Z"),
            exibDia: "segunda,terca,quarta,quinta,sexta,sabado,domingo",
            exibManha: true,
            exibTarde: true,
            exibNoite: true,
            exibInicio: new Date("2025-10-20T00:00:00Z"),
            exibFim: new Date("2025-11-10T23:59:59Z"),
            organizador: {
                _id: "placeholder-id-coordenacao-ads",
                nome: "Coordenação de ADS"
            },
            link: 'data:image/gif;base64,R0lGODlhZABkAJEAAAAAAP///wAAAAAAACH5BAEAAAIALAAAAABkAGQAAAL/jI+py+0Po5y02ouz3rz7D4biSJbmiabqCgLuC8fyjMDYjOf2pPf0sbP4hi8KkVgrXo5DI7OXdN2eOqd0qTT4IMFKl5v1hrePLy8MvgrH0DL6rI6YJV2yYy5/39lVoD6AEwUgKBjoF5c2eJhDuGCoxacI2TcpmRdnB/j3qIkZyYnHUNdWKfpTulh42mmZqCrTiKqAN0rJamWZWdua6vi5GurrabtrithbCfpnnEt6i5xA+wsL7bqofLyX/ZwMvCzcTPw9uzkdE3sZzljttr2LzautDo/L/HrOLj+1fV+MxQ9uX7xozoLpgzPQmjx6/xIGbJiI4RqA5KhI5IbR4jo6/xq9DVPXzyKujpHQvSPpsCLKjybNaWTB7CRFmC084qOJAp5BnB50jkshc96qkCwfdpvZktrRmwTFuTNX75rLck4HBo26lKjVglSFIpVaVFbGIwob7LyXFCTYjWZ/nl2bNm0me+1SNmXqTyyTsnQ5KsWIrmzetn8jljSaLm7dt1nzAa6reOFPtI4Zjw1LmKnhmdKecub6VeXOzls/VxU4umvfzBdHulWNOKZNgZQb650ampXlq3ChBd09FHJv25e9al482bfNwb+TE+d5MbpzmNL/DuYpG3N1u9BnDy/OYeX1tbzFokYZmDxUx65Jpl9a/vFE8e91Lz+swbLc6fsLI8Sk/R1W9vnnF3eIcSLgXP9BFOCC8PGn3GmxRYhXcPNpVR9ptQ1o4EEPYpbhes8x+KFaKq3mU24ogmZciARyCGCJ/Zl4F2n6UbjdeCPumJh62nknWlc33iYhjzrKl0FzP7545JCZYYgjbOaxRyKHzFkI3oT5QTilka951iGSfDXY5V2rjVlgdqXZpaGDYoDZpodmIrQSlCceyGWN6Pm45ooqglMnn2dSGJ54HyFYGX7YLcpoo44+Cmmkkk5KaaWWXoppCQUAADs=',
            tags: ["Tecnologia", "Programação", "Inovação"],
            categoria: "competição",
            cor: 1,
            animacao: 2,
            status: 1,
            midia: [
                { midiTipo: 'capa', midiLink: 'https://images.pexels.com/photos/34037760/pexels-photo-34037760.jpeg' },
                { midiTipo: 'carrossel', midiLink: 'https://plus.unsplash.com/premium_photo-1690303193653-0418179e5512?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=697' },
                { midiTipo: 'carrossel', midiLink: 'https://images.pexels.com/photos/1181260/pexels-photo-1181260.jpeg' }
            ],
            permissoes: [],
        },
        {
            titulo: "Feira de Ciências e Tecnologia (FECIT)",
            descricao: "Exposição dos melhores projetos de pesquisa e inovação desenvolvidos pelos alunos do ensino médio e superior do campus. Venha prestigiar nossos futuros cientistas!",
            local: "Ginásio de Esportes",
            dataInicio: new Date("2025-10-22T08:00:00Z"),
            dataFim: new Date("2025-10-23T17:00:00Z"),
            exibDia: "segunda,terca,quarta,quinta,sexta",
            exibManha: true,
            exibTarde: true,
            exibNoite: false,
            exibInicio: new Date("2025-10-01T00:00:00Z"),
            exibFim: new Date("2025-10-23T23:59:59Z"),
            organizador: {
                _id: "placeholder-id-departamento-extensao",
                nome: "Departamento de Extensão"
            },
            link: "data:image/gif;base64,R0lGODlhZABkAJEAAAAAAP///wAAAAAAACH5BAEAAAIALAAAAABkAGQAAAL/jI+py+0Po5y02ouz3rz7D4biSJbmiabqCgLuC8fyjMDYjOf2pPf0sbP4hi8KkVgrXo5DI7OXdN2eOqd0qTT4IMFKl5v1hrePLy8MvgrH0DL6rI6YJV2yYy5/39lVoD6AEwUgKBjoF5c2eJhDuGCoxacI2TcpmRdnB/j3qIkZyYnHUNdWKfpTulh42mmZqCrTiKqAN0rJamWZWdua6vi5GurrabtrithbCfpnnEt6i5xA+wsL7bqofLyX/ZwMvCzcTPw9uzkdE3sZzljttr2LzautDo/L/HrOLj+1fV+MxQ9uX7xozoLpgzPQmjx6/xIGbJiI4RqA5KhI5IbR4jo6/xq9DVPXzyKujpHQvSPpsCLKjybNaWTB7CRFmC084qOJAp5BnB50jkshc96qkCwfdpvZktrRmwTFuTNX75rLck4HBo26lKjVglSFIpVaVFbGIwob7LyXFCTYjWZ/nl2bNm0me+1SNmXqTyyTsnQ5KsWIrmzetn8jljSaLm7dt1nzAa6reOFPtI4Zjw1LmKnhmdKecub6VeXOzls/VxU4umvfzBdHulWNOKZNgZQb650ampXlq3ChBd09FHJv25e9al482bfNwb+TE+d5MbpzmNL/DuYpG3N1u9BnDy/OYeX1tbzFokYZmDxUx65Jpl9a/vFE8e91Lz+swbLc6fsLI8Sk/R1W9vnnF3eIcSLgXP9BFOCC8PGn3GmxRYhXcPNpVR9ptQ1o4EEPYpbhes8x+KFaKq3mU24ogmZciARyCGCJ/Zl4F2n6UbjdeCPumJh62nknWlc33iYhjzrKl0FzP7545JCZYYgjbOaxRyKHzFkI3oT5QTilka951iGSfDXY5V2rjVlgdqXZpaGDYoDZpodmIrQSlCceyGWN6Pm45ooqglMnn2dSGJ54HyFYGX7YLcpoo44+Cmmkkk5KaaWWXoppCQUAADs=",
            tags: ["Ciência", "Pesquisa", "Tecnologia"],
            categoria: "exposição",
            cor: 2,
            animacao: 1,
            status: 1,
            midia: [
                { midiTipo: 'capa', midiLink: 'https://plus.unsplash.com/premium_photo-1661432575489-b0400f4fea58?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1172' },
                { midiTipo: 'carrossel', midiLink: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b' },
                { midiTipo: 'carrossel', midiLink: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170' },
                { midiTipo: 'carrossel', midiLink: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170' }
            ],
            permissoes: [],
        },
        {
            titulo: "Workshop: Introdução ao Desenvolvimento Web com Node.js",
            descricao: "Aprenda os conceitos básicos de back-end com Node.js e crie sua primeira API. Workshop prático de 4 horas. Vagas limitadas, inscreva-se já!",
            local: "Auditório Central",
            dataInicio: new Date("2025-11-12T14:00:00Z"),
            dataFim: new Date("2025-11-12T18:00:00Z"),
            exibDia: "segunda,terca,quarta",
            exibManha: false,
            exibTarde: true,
            exibNoite: false,
            exibInicio: new Date("2025-10-10T00:00:00Z"),
            exibFim: new Date("2025-11-12T23:59:59Z"),
            organizador: {
                _id: "placeholder-id-coordenacao-ads",
                nome: "Coordenação de ADS"
            },
            link: "data:image/gif;base64,R0lGODlhZABkAJEAAAAAAP///wAAAAAAACH5BAEAAAIALAAAAABkAGQAAAL/jI+py+0Po5y02ouz3rz7D4biSJbmiabqCgLuC8fyjMDYjOf2pPf0sbP4hi8KkVgrXo5DI7OXdN2eOqd0qTT4IMFKl5v1hrePLy8MvgrH0DL6rI6YJV2yYy5/39lVoD6AEwUgKBjoF5c2eJhDuGCoxacI2TcpmRdnB/j3qIkZyYnHUNdWKfpTulh42mmZqCrTiKqAN0rJamWZWdua6vi5GurrabtrithbCfpnnEt6i5xA+wsL7bqofLyX/ZwMvCzcTPw9uzkdE3sZzljttr2LzautDo/L/HrOLj+1fV+MxQ9uX7xozoLpgzPQmjx6/xIGbJiI4RqA5KhI5IbR4jo6/xq9DVPXzyKujpHQvSPpsCLKjybNaWTB7CRFmC084qOJAp5BnB50jkshc96qkCwfdpvZktrRmwTFuTNX75rLck4HBo26lKjVglSFIpVaVFbGIwob7LyXFCTYjWZ/nl2bNm0me+1SNmXqTyyTsnQ5KsWIrmzetn8jljSaLm7dt1nzAa6reOFPtI4Zjw1LmKnhmdKecub6VeXOzls/VxU4umvfzBdHulWNOKZNgZQb650ampXlq3ChBd09FHJv25e9al482bfNwb+TE+d5MbpzmNL/DuYpG3N1u9BnDy/OYeX1tbzFokYZmDxUx65Jpl9a/vFE8e91Lz+swbLc6fsLI8Sk/R1W9vnnF3eIcSLgXP9BFOCC8PGn3GmxRYhXcPNpVR9ptQ1o4EEPYpbhes8x+KFaKq3mU24ogmZciARyCGCJ/Zl4F2n6UbjdeCPumJh62nknWlc33iYhjzrKl0FzP7545JCZYYgjbOaxRyKHzFkI3oT5QTilka951iGSfDXY5V2rjVlgdqXZpaGDYoDZpodmIrQSlCceyGWN6Pm45ooqglMnn2dSGJ54HyFYGX7YLcpoo44+Cmmkkk5KaaWWXoppCQUAADs=",
            tags: ["Node.js", "Backend", "Programação"],
            categoria: "workshop",
            cor: 3,
            animacao: 6,
            status: 1,
            midia: [
                { midiTipo: 'capa', midiLink: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170' },
                { midiTipo: 'carrossel', midiLink: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074' },
                { midiTipo: 'carrossel', midiLink: 'https://images.unsplash.com/photo-1619410283995-43d9134e7656?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170' }
            ],
            permissoes: [],
        },
        {
            titulo: "Palestra: Carreira e Mercado de Trabalho em TI",
            descricao: "Profissionais renomados da região compartilham suas experiências e dão dicas valiosas sobre como construir uma carreira de sucesso na área de Tecnologia da Informação.",
            local: "Auditório Central",
            dataInicio: new Date("2025-10-30T19:00:00Z"),
            dataFim: new Date("2025-10-30T21:30:00Z"),
            exibDia: "quinta,sexta",
            exibManha: false,
            exibTarde: false,
            exibNoite: true,
            exibInicio: new Date("2025-10-25T00:00:00Z"),
            exibFim: new Date("2025-10-30T23:59:59Z"),
            organizador: {
                _id: "placeholder-id-departamento-extensao",
                nome: "Departamento de Extensão"
            },
            link: 'data:image/gif;base64,R0lGODlhZABkAJEAAAAAAP///wAAAAAAACH5BAEAAAIALAAAAABkAGQAAAL/jI+py+0Po5y02ouz3rz7D4biSJbmiabqCgLuC8fyjMDYjOf2pPf0sbP4hi8KkVgrXo5DI7OXdN2eOqd0qTT4IMFKl5v1hrePLy8MvgrH0DL6rI6YJV2yYy5/39lVoD6AEwUgKBjoF5c2eJhDuGCoxacI2TcpmRdnB/j3qIkZyYnHUNdWKfpTulh42mmZqCrTiKqAN0rJamWZWdua6vi5GurrabtrithbCfpnnEt6i5xA+wsL7bqofLyX/ZwMvCzcTPw9uzkdE3sZzljttr2LzautDo/L/HrOLj+1fV+MxQ9uX7xozoLpgzPQmjx6/xIGbJiI4RqA5KhI5IbR4jo6/xq9DVPXzyKujpHQvSPpsCLKjybNaWTB7CRFmC084qOJAp5BnB50jkshc96qkCwfdpvZktrRmwTFuTNX75rLck4HBo26lKjVglSFIpVaVFbGIwob7LyXFCTYjWZ/nl2bNm0me+1SNmXqTyyTsnQ5KsWIrmzetn8jljSaLm7dt1nzAa6reOFPtI4Zjw1LmKnhmdKecub6VeXOzls/VxU4umvfzBdHulWNOKZNgZQb650ampXlq3ChBd09FHJv25e9al482bfNwb+TE+d5MbpzmNL/DuYpG3N1u9BnDy/OYeX1tbzFokYZmDxUx65Jpl9a/vFE8e91Lz+swbLc6fsLI8Sk/R1W9vnnF3eIcSLgXP9BFOCC8PGn3GmxRYhXcPNpVR9ptQ1o4EEPYpbhes8x+KFaKq3mU24ogmZciARyCGCJ/Zl4F2n6UbjdeCPumJh62nknWlc33iYhjzrKl0FzP7545JCZYYgjbOaxRyKHzFkI3oT5QTilka951iGSfDXY5V2rjVlgdqXZpaGDYoDZpodmIrQSlCceyGWN6Pm45ooqglMnn2dSGJ54HyFYGX7YLcpoo44+Cmmkkk5KaaWWXoppCQUAADs=',
            tags: ["Carreira", "Mercado de Trabalho", "TI"],
            categoria: "palestra",
            cor: 4,
            animacao: 4,
            status: 1,
            midia: [
                { midiTipo: 'capa', midiLink: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170' },
                { midiTipo: 'carrossel', midiLink: 'https://images.unsplash.com/photo-1525284412981-f7591a441578?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=781' },
                { midiTipo: 'carrossel', midiLink: 'https://plus.unsplash.com/premium_photo-1678566153919-86c4ba4216f1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170' }
            ],
            permissoes: [],
        },
        {
            titulo: "IFRO de Portas Abertas",
            descricao: "Conheça nosso campus! Um dia inteiro com visitas guiadas, apresentação dos cursos e demonstração dos laboratórios para toda a comunidade externa.",
            local: "Todo o Campus",
            dataInicio: new Date("2025-09-27T08:00:00Z"),
            dataFim: new Date("2025-10-27T17:00:00Z"),
            exibDia: "segunda,terca,quarta,quinta,sexta,sabado",
            exibManha: true,
            exibTarde: true,
            exibNoite: false,
            exibInicio: new Date("2025-09-15T00:00:00Z"),
            exibFim: new Date("2025-10-27T23:59:59Z"),
            organizador: {
                _id: "placeholder-id-gremio-estudantil",
                nome: "Grêmio Estudantil"
            },
            link: 'data:image/gif;base64,R0lGODlhZABkAJEAAAAAAP///wAAAAAAACH5BAEAAAIALAAAAABkAGQAAAL/jI+py+0Po5y02ouz3rz7D4biSJbmiabqCgLuC8fyjMDYjOf2pPf0sbP4hi8KkVgrXo5DI7OXdN2eOqd0qTT4IMFKl5v1hrePLy8MvgrH0DL6rI6YJV2yYy5/39lVoD6AEwUgKBjoF5c2eJhDuGCoxacI2TcpmRdnB/j3qIkZyYnHUNdWKfpTulh42mmZqCrTiKqAN0rJamWZWdua6vi5GurrabtrithbCfpnnEt6i5xA+wsL7bqofLyX/ZwMvCzcTPw9uzkdE3sZzljttr2LzautDo/L/HrOLj+1fV+MxQ9uX7xozoLpgzPQmjx6/xIGbJiI4RqA5KhI5IbR4jo6/xq9DVPXzyKujpHQvSPpsCLKjybNaWTB7CRFmC084qOJAp5BnB50jkshc96qkCwfdpvZktrRmwTFuTNX75rLck4HBo26lKjVglSFIpVaVFbGIwob7LyXFCTYjWZ/nl2bNm0me+1SNmXqTyyTsnQ5KsWIrmzetn8jljSaLm7dt1nzAa6reOFPtI4Zjw1LmKnhmdKecub6VeXOzls/VxU4umvfzBdHulWNOKZNgZQb650ampXlq3ChBd09FHJv25e9al482bfNwb+TE+d5MbpzmNL/DuYpG3N1u9BnDy/OYeX1tbzFokYZmDxUx65Jpl9a/vFE8e91Lz+swbLc6fsLI8Sk/R1W9vnnF3eIcSLgXP9BFOCC8PGn3GmxRYhXcPNpVR9ptQ1o4EEPYpbhes8x+KFaKq3mU24ogmZciARyCGCJ/Zl4F2n6UbjdeCPumJh62nknWlc33iYhjzrKl0FzP7545JCZYYgjbOaxRyKHzFkI3oT5QTilka951iGSfDXY5V2rjVlgdqXZpaGDYoDZpodmIrQSlCceyGWN6Pm45ooqglMnn2dSGJ54HyFYGX7YLcpoo44+Cmmkkk5KaaWWXoppCQUAADs=',
            tags: ["Institucional", "Comunidade", "Visita", "Cursos"],
            categoria: "institucional",
            cor: 5,
            animacao: 3,
            status: 1,
            midia: [
                { midiTipo: 'capa', midiLink: 'https://portal.ifro.edu.br/images/Campi/Vilhena/Imagens/EstruturaFisica/20170812_084720.jpg' },
                { midiTipo: 'carrossel', midiLink: 'https://portal.ifro.edu.br/images/Campi/Vilhena/Imagens/EstruturaFisica/IMG-20170624-WA0026.jpg' },
                { midiTipo: 'carrossel', midiLink: 'https://portal.ifro.edu.br/images/Campi/Vilhena/Imagens/EstruturaFisica/IFRO_tarde2.png' },
                { midiTipo: 'carrossel', midiLink: 'https://portal.ifro.edu.br/images/Campi/Vilhena/Imagens/EstruturaFisica/IFRO_superior2.png' },
                { midiTipo: 'carrossel', midiLink: 'https://portal.ifro.edu.br/images/Campi/Vilhena/Imagens/EstruturaFisica/IFRO_da_1.png' },
                { midiTipo: 'carrossel', midiLink: 'https://portal.ifro.edu.br/images/Campi/Vilhena/Imagens/EstruturaFisica/IFRO_noite.png' },
                { midiTipo: 'carrossel', midiLink: 'https://portal.ifro.edu.br/images/Campi/Vilhena/Imagens/EstruturaFisica/IFRO_superior.png' },
            ],
            permissoes: [],
        }
    ];

    await Evento.collection.insertMany(eventosFixos);
    console.log(`${eventosFixos.length} Eventos fixos inseridos com sucesso!`);

    const mapping = await getGlobalFakeMapping();

    const eventosAleatorios = [];

    for (let i = 0; i < 20; i++) {
        const dataInicio = mapping.dataInicio();
        const dataFim = new Date(dataInicio.getTime() + (2 * 60 * 60 * 1000)); // +2h

        const midiaArr = mapping.midia ? mapping.midia() : [];

        eventosAleatorios.push({
            titulo: mapping.titulo(),
            descricao: mapping.descricao(),
            local: mapping.local(),
            dataInicio,
            dataFim,
            exibDia: mapping.exibDia(),
            exibManha: mapping.exibManha(),
            exibTarde: mapping.exibTarde(),
            exibNoite: mapping.exibNoite(),
            exibInicio: mapping.exibInicio(),
            exibFim: mapping.exibFim(),
            organizador: {
                _id: usuarios[i % usuarios.length]._id,
                nome: usuarios[i % usuarios.length].nome
            },
            link: mapping.linkInscricao ? mapping.linkInscricao() : (mapping.link ? mapping.link() : ''),
            tags: Array.isArray(mapping.tags) ? mapping.tags().join(',') : (mapping.tags ? mapping.tags() : ''),
            categoria: mapping.categoria ? mapping.categoria() : 'institucional',
            cor: 0,
            animacao: 0,
            status: toStatusNumber(mapping.status ? mapping.status() : 'inativo'),
            midia: mapping.midia,
            permissoes: mapping.permissoes ? mapping.permissoes() : [],
        });
    };

    if (eventosAleatorios.length > 0) {
        await Evento.collection.insertMany(eventosAleatorios);
        console.log(`${eventosAleatorios.length} Eventos aleatórios inseridos com sucesso!`);
    }
}

export default seedEventos;
