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
    .delete("/eventos/:eventoId/midia/:tipo/:midiaId", AuthMiddleware, asyncWrapper(uploadController.deletarMidia.bind(uploadController)))

export default router;

/*
// ✅ POST para adicionar qualquer tipo de mídia. O tipo vai no corpo da requisição (form-data).
.post("/eventos/:eventoId/midias", AuthMiddleware, uploadMultiploParcial, asyncWrapper(uploadController.adicionarMidia.bind(uploadController)))

// ✅ GET para listar todas as mídias ou filtrar por tipo via query param (ex: /midias?tipo=capa)
.get("/eventos/:eventoId/midias", AuthMiddleware, asyncWrapper(uploadController.listarMidias.bind(uploadController)))

// ✅ DELETE para remover uma mídia específica pelo seu ID único.
.delete("/eventos/:eventoId/midias/:midiaId", AuthMiddleware, asyncWrapper(uploadController.deletarMidia.bind(uploadController)))

colocar filtro na midia para selecinar o tipo (capa, video, carrossel)
mudar para tudo ser midias

*/