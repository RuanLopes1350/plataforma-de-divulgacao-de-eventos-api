import express from "express";
import AuthController from '../controllers/AuthController.js';
import UsuarioController from '../controllers/UsuarioController.js';
import { asyncWrapper } from '../utils/helpers/index.js';

const router = express.Router();

const authController = new AuthController();
const usuarioController = new UsuarioController

router  
  .post("/login", asyncWrapper(authController.login.bind(authController)))
  .post("/logout", asyncWrapper(authController.logout.bind(authController)))
  .post("/refresh", asyncWrapper(authController.refresh.bind(authController)))
  .post("/signup", asyncWrapper(usuarioController.cadastrarComSenha.bind(usuarioController)))
  .post("/recover", asyncWrapper(authController.recuperaSenha.bind(authController)))
  .patch("/password/reset/token", asyncWrapper(authController.atualizarSenhaToken.bind(authController)))

export default router;