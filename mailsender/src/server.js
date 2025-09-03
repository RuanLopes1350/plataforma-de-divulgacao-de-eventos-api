// src/server.js
import express       from 'express';
import path          from 'path';
import dotenv        from 'dotenv';
import swaggerUi     from 'swagger-ui-express';
import YAML          from 'yamljs';

import { sendEmail }           from './mailer/index.js';
import { createApiKey,
         listApiKeys,
         deleteApiKey }        from './auth/apiKeyStore.js';
import { requireApiKey }       from './auth/apiKeyMiddleware.js';
import { requireMasterKey }    from './auth/masterKeyMiddleware.js';

dotenv.config();
const app = express();
app.use(express.json());

/* ───── Swagger ───── */
const swaggerDoc = YAML.load('./openapi.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

/* ───── Página estática de administração ───── */
app.use('/panel', express.static(path.resolve('public')));

/* ───── Health-check ───── */
app.get('/', (_req, res) =>
  res.json({ ok: true, message: 'Micro-service online' })
);

/* ───── Gestão de API-Keys ───── */
app.post('/keys/generate', requireMasterKey, async (req, res) => {
  try {
    const { name = 'unnamed' } = req.body ?? {};
    const apiKey = await createApiKey(name);
    res.status(201).json({
      name,
      message: 'Chave criada – salve em local seguro (não será mostrada de novo)',
      apiKey,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Falha ao gerar chave', error: err.message });
  }
});

app.get('/keys', requireMasterKey, async (_req, res) => {
  res.json(await listApiKeys());
});

app.delete('/keys/:name', requireMasterKey, async (req, res) => {
  const ok = await deleteApiKey(req.params.name);
  if (ok) return res.status(204).end();
  res.status(404).json({ message: 'Chave não encontrada' });
});

/* ───── Envio de e-mail ───── */
app.post('/emails/send', requireApiKey, async (req, res) => {
  try {
    const info = await sendEmail(req.body);
    res.status(202).json({ message: 'E-mail enfileirado', info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Falha ao enviar e-mail', error: err.message });
  }
});

/* ───── Boot ───── */
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Mail-API na porta ${PORT}`));
