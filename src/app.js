// src/app.js
import express from 'express';
import routes from './routes/index.js';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import DbConnect from './config/DbConnect.js';
import errorHandler from './utils/helpers/errorHandler.js';
import logger from './utils/logger.js';
import CommonResponse from './utils/helpers/CommonResponse.js';

const app = express();

/* ───────────── 1. Conexão ao banco ───────────── */
await DbConnect.conectar();

/* ───────────── 2. Middlewares globais ───────────── */
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta uploads
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

/* ───────────── 3. Rotas ───────────── */
routes(app);

/* ───────────── 4. 404 – rota não encontrada ───────────── */
app.use((req, res) => {
  return CommonResponse.error(
    res,
    404,
    'resourceNotFound',
    null,
    [{ message: 'Rota não encontrada.' }]
  );
});

/* ───────────── 5. Eventos globais de erro não tratado ───────────── */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
});

/* ───────────── 6. Middleware central de erros ───────────── */
app.use(errorHandler);

export default app;