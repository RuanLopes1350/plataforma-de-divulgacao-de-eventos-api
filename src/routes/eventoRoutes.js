// src/routes/eventoRoutes.js

import express from "express";

import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import EventoController from '../controllers/EventoController.js';
import UploadController from "../controllers/UploadController.js";
import { asyncWrapper } from '../utils/helpers/index.js';

import multer from 'multer';
import AdminMiddleware from "../middlewares/AdminMiddleware.js";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const router = express.Router();

const eventoController = new EventoController();  // Instância da classe
const uploadController = new UploadController();  // Instância da classe

router
    .post("/eventos/", AuthMiddleware, asyncWrapper(eventoController.cadastrar.bind(eventoController)))
    .get("/eventos/admin", AuthMiddleware, AdminMiddleware, asyncWrapper(eventoController.listarTodosEventos.bind(eventoController)))
    .get("/eventos", AuthMiddleware, asyncWrapper(eventoController.listar.bind(eventoController)))
    .get("/eventos/:id", AuthMiddleware, asyncWrapper(eventoController.listar.bind(eventoController)))
    .get("/eventos/:id/qrcode", AuthMiddleware, asyncWrapper(eventoController.gerarQRCode.bind(eventoController)))
    .patch("/eventos/:id", AuthMiddleware, asyncWrapper(eventoController.alterar.bind(eventoController)))
    .post("/eventos/:id/compartilhar", AuthMiddleware, asyncWrapper(eventoController.compartilharPermissao.bind(eventoController)))
    .delete("/eventos/:id", AuthMiddleware, asyncWrapper(eventoController.deletar.bind(eventoController)))

    // Rotas Adicionais (Mídias)
    .post("/eventos/:id/midias", AuthMiddleware, upload.array('files'), asyncWrapper(uploadController.adicionarMultiplasMidias.bind(uploadController)))
    .delete("/eventos/:eventoId/midia/:midiaId", AuthMiddleware, asyncWrapper(uploadController.deletarMidia.bind(uploadController)))

    // Nova rota específica para o totem
    .get("/totem/eventos", asyncWrapper(eventoController.listarParaTotem.bind(eventoController)))

export default router;
