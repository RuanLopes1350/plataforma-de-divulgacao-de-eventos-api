// server.js

import "dotenv/config";
import app from "./src/app.js";
const port = process.env.API_PORT || 5001;
const host = '0.0.0.0';

//Mensagem com o link do servidor//
app.listen(port, host, () => {
    console.log(`Servidor escutando em http://${host}:${port}`);
});
