import fs from 'fs/promises';
import path from 'path';
import mjml2html from 'mjml';
import handlebars from 'handlebars';
import { getTransport } from '../config/mail.js';

const TEMPLATE_DIR = path.resolve('src', 'mailer', 'templates');

export async function sendEmail({ to, subject, template, data = {} }) {
  // 1. Lê o arquivo MJML
  const mjmlPath = path.join(TEMPLATE_DIR, `${template}.mjml`);
  const rawMjml = await fs.readFile(mjmlPath, 'utf8');

  // 2. Compila Handlebars → MJML com dados injetados
  const mjmlWithData = handlebars.compile(rawMjml)(data);

  // 3. Converte MJML → HTML
  const { html, errors } = mjml2html(mjmlWithData, { validationLevel: 'soft' });
  if (errors.length) console.warn('MJML validation warnings:', errors);

  // 4. Envia
  const transport = await getTransport();
  const info = await transport.sendMail({
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    html,
  });

  return info;
}
