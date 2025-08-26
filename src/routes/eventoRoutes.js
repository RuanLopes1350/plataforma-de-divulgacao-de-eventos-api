// src/routes/eventoRoutes.js

import express from "express";
import { uploadMultiploIntegrado, uploadMultiploParcial } from "../config/multerConfig.js";

import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import EventoController from '../controllers/EventoController.js';
import UploadController from "../controllers/UploadController.js";
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const eventoController = new EventoController();  // Instância da classe
const uploadController = new UploadController();  // Instância da classe

router
    .post("/eventos/", AuthMiddleware, uploadMultiploIntegrado, asyncWrapper(eventoController.cadastrar.bind(eventoController)))
    .get("/eventos", AuthMiddleware, asyncWrapper(eventoController.listar.bind(eventoController)))
    .get("/eventos/:id", AuthMiddleware, asyncWrapper(eventoController.listar.bind(eventoController)))
    .get("/eventos/:id/qrcode", AuthMiddleware, asyncWrapper(eventoController.gerarQRCode.bind(eventoController)))
    .patch("/eventos/:id", AuthMiddleware, asyncWrapper(eventoController.alterar.bind(eventoController)))
    .patch("/eventos/:id/status", AuthMiddleware, asyncWrapper(eventoController.alterarStatus.bind(eventoController)))
    .patch("/eventos/:id/compartilhar", AuthMiddleware, asyncWrapper(eventoController.compartilharPermissao.bind(eventoController)))
    .delete("/eventos/:id", AuthMiddleware, asyncWrapper(eventoController.deletar.bind(eventoController)))

    // Rotas Adicionais (Mídias)
    .post("/eventos/:id/midia/:tipo", AuthMiddleware, uploadMultiploParcial, asyncWrapper(uploadController.adicionarMidia.bind(uploadController)))
    .get("/eventos/:id/midias", AuthMiddleware, asyncWrapper(uploadController.listarTodasMidias.bind(uploadController)))
    .get("/eventos/:id/midia/capa", AuthMiddleware, asyncWrapper(uploadController.listarMidiaCapa.bind(uploadController)))
    .get("/eventos/:id/midia/video", AuthMiddleware, asyncWrapper(uploadController.listarMidiaVideo.bind(uploadController)))
    .get("/eventos/:id/midia/carrossel/:index", AuthMiddleware, asyncWrapper(uploadController.listarMidiaCarrossel.bind(uploadController)))
    .delete("/eventos/:eventoId/midia/:tipo/:midiaId", AuthMiddleware, asyncWrapper(uploadController.deletarMidia.bind(uploadController)))

export default router;