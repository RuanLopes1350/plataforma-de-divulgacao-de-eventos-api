import axios from 'axios';
import 'dotenv/config';

const RESEND_API_URL = 'https://api.resend.com/emails';
const apiKey = process.env.MAIL_API_KEY;
const mailFrom = process.env.MAIL_FROM || 'noreply@fslab.dev';

/**
 * Renderiza o template "generico" como HTML a partir dos dados do email.
 */
function renderGenericoHtml(data) {
    const header = data.mostrarHeader ? `
        <div style="background: linear-gradient(135deg, ${data.corPrimaria || '#4338CA'}, ${data.corPrimaria || '#4338CA'}cc); padding: 24px; text-align: center;">
            ${data.logoUrl ? `<img src="${data.logoUrl}" alt="${data.nomeSistema || ''}" style="height: 48px; margin-bottom: 8px;" />` : ''}
            ${data.nomeSistema ? `<h2 style="color: #ffffff; margin: 0; font-size: 20px;">${data.nomeSistema}</h2>` : ''}
        </div>
        ${data.mostrarDivisor ? '<hr style="border: none; border-top: 3px solid #e2e8f0; margin: 0;" />' : ''}
    ` : '';

    const botaoPrimario = data.mostrarBotao ? `
        <div style="text-align: center; margin: 24px 0;">
            <a href="${data.urlBotao}" style="background-color: ${data.corBotao || '#4338CA'}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${data.textoBotao}</a>
        </div>
    ` : '';

    const botaoSecundario = data.mostrarBotaoSecundario ? `
        <div style="text-align: center; margin: 12px 0;">
            <a href="${data.urlBotaoSecundario}" style="background-color: ${data.corBotaoSecundario || '#6B46C1'}; color: #ffffff; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${data.textoBotaoSecundario}</a>
        </div>
    ` : '';

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f7fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            ${header}
            <div style="padding: 32px 24px;">
                ${data.titulo ? `<h1 style="color: #1a202c; font-size: 22px; margin-bottom: 16px;">${data.titulo}</h1>` : ''}
                ${data.nome ? `<p style="color: #4a5568; font-size: 16px;">Olá, <strong>${data.nome}</strong>!</p>` : ''}
                ${data.mensagem ? `<p style="color: #4a5568; font-size: 15px; line-height: 1.6;">${data.mensagem}</p>` : ''}
                ${data.textoDestaque ? `<p style="background-color: #fefcbf; padding: 12px; border-radius: 6px; color: #744210; font-size: 14px;">${data.textoDestaque}</p>` : ''}
                ${data.infoAdicional ? `<p style="color: #718096; font-size: 13px; line-height: 1.5;">${data.infoAdicional}</p>` : ''}
                ${botaoPrimario}
                ${botaoSecundario}
            </div>
            <div style="background-color: #f7fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #a0aec0;">
                ${data.textoFooter || ''}
            </div>
        </div>
    </body>
    </html>`;
}

/**
 * Envia email via Resend API.
 * Aceita o mesmo formato de objeto gerado pelos templates (to, subject, template, data).
 */
export async function enviarEmail(email) {
    try {
        const html = renderGenericoHtml(email.data || {});

        const resposta = await axios.post(
            RESEND_API_URL,
            {
                from: mailFrom,
                to: Array.isArray(email.to) ? email.to : [email.to],
                subject: email.subject,
                html: html,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );
        console.log(`Email enviado com sucesso via Resend: ${resposta.data.id}`);
    } catch (erro) {
        console.error('Erro ao enviar email via Resend:', erro.response?.data || erro.message);
    }
}