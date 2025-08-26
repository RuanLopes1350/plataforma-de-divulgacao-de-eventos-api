// src/routes/index.js

// Bibliotecas
import express from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import getSwaggerOptions from "../docs/config/head.js";
import logRoutes from "../middlewares/LogRoutesMiddleware.js";
import { CommonResponse } from "../utils/helpers/index.js";

// routes
import auth from "./authRoutes.js";
import usuarioRoutes from "./usuarioRoutes.js";
import eventoRoutes from "./eventoRoutes.js";

import dotenv from "dotenv";

dotenv.config();

const routes = (app) => {
    if (process.env.DEBUGLOG) {
        app.use(logRoutes);
    }
    // rota para encaminhar da raiz para /docs
    app.get("/", (req, res) => {
        res.redirect("/docs");
    }
    );

    const swaggerDocs = swaggerJsDoc(getSwaggerOptions());
    app.use(swaggerUI.serve);
    app.get("/docs", (req, res, next) => {
        swaggerUI.setup(swaggerDocs)(req, res, next);
    });

    app.use(express.json(),
        auth, 
        usuarioRoutes,
        eventoRoutes,
    );

    // Se não é nenhuma rota válida, produz 404
    app.use((req, res) => {
        return CommonResponse.error(res, 404, 'notFound', null, [], 'Rota não encontrada.');
    });
};

export default routes;