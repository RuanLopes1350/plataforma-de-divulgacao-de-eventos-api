import axios from 'axios';

import 'dotenv/config';

export async function enviarEmail(email) {
    const url = process.env.URL_MAIL_SERVICE || 'http://localhost:1350/emails/send';

    try {
        const resposta = await axios.post(
            url,
            email,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.MAIL_API_KEY
                }
            }
        )
        console.log(`Resposta do envio de emails: ${resposta}`)
    } catch (erro) {
         console.error('Erro:', erro.response?.data || erro.message);
    }
}