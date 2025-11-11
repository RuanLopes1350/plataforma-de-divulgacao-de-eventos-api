// src/routes/usuarioRoutes.js

import express from "express";

import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AdminMiddleware from "../middlewares/AdminMiddleware.js";
import UsuarioController from "../controllers/UsuarioController.js";
import { asyncWrapper } from "../utils/helpers/index.js";

const router = express.Router();

const usuarioController = new UsuarioController();  // Instância da classe

router
  .post("/usuarios/", AuthMiddleware, AdminMiddleware, asyncWrapper(usuarioController.cadastrar.bind(usuarioController)))
  .get("/usuarios/", AuthMiddleware, asyncWrapper(usuarioController.listar.bind(usuarioController)))
  .get("/usuarios/:id", AuthMiddleware, asyncWrapper(usuarioController.listar.bind(usuarioController)))
  .patch("/usuarios/:id", AuthMiddleware, asyncWrapper(usuarioController.alterar.bind(usuarioController)))
  .patch("/usuarios/:id/admin", AuthMiddleware, AdminMiddleware, asyncWrapper(usuarioController.alterarAdmin.bind(usuarioController)))
  .patch("/usuarios/:id/status", AuthMiddleware, AdminMiddleware, asyncWrapper(usuarioController.alterarStatus.bind(usuarioController)))
  .delete("/usuarios/:id", AuthMiddleware, AdminMiddleware, asyncWrapper(usuarioController.deletar.bind(usuarioController)))

export default router;