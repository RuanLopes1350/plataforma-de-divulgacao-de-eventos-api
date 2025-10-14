import axios from 'axios';

import 'dotenv/config';

const MailService = process.env.URL_MAIL_SERVICE
const apiKey = process.env.MAIL_API_KEY

export async function enviarEmail(email) {
    const url = MailService

    try {
        const resposta = await axios.post(
            url,
            email,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                }
            }
        )
        console.log(`Resposta do envio de emails: ${resposta.data.message}`)
    } catch (erro) {
         console.error('Erro:', erro.response?.data || erro.message);
    }
}