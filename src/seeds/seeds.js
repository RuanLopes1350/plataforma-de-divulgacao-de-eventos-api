// /src/seeds/seeds.js

import "dotenv/config";
import mongoose from "mongoose";

// Conexão com o banco
import DbConnect from "../config/DbConnect.js";

// Importação das seeds separadas
import seedUsuarios from "./seedsUsuarios.js";
import seedEventos from "./seedsEventos.js";


// ----------------------------------------------------------------------------
// 1) Conectar ao banco de dados
// ----------------------------------------------------------------------------
await DbConnect.conectar();

// ----------------------------------------------------------------------------
// 2) Execução final (ordem de chamada)
// ----------------------------------------------------------------------------
async function main() {
    try {
        // 1 Entidades de acesso
        const usuarios = await seedUsuarios();
        await seedEventos(usuarios);

        console.log(">>>> SEED FINALIZADO COM SUCESSO! <<<<");
    } catch (err) {
        console.log("Erro ao executar SEED:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

// Função que executa tudo
main();