// server.js

import "dotenv/config";
import app from "./src/app.js";
const port = process.env.API_PORT || 5001;

//Mensagem com o link do servidor//
app.listen(port, (error) => {
    if(error) {
        console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
    console.log(`Servidor escutando em http://localhost:${port}`);
});
