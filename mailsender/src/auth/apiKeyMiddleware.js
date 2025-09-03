// src/auth/apiKeyMiddleware.js
import { isValidApiKey } from './apiKeyStore.js';

export async function requireApiKey(req, res, next) {
  const apiKey = req.header('x-api-key') || req.query.apiKey;

  if (!apiKey) {
    return res
      .status(401)
      .json({ message: 'x-api-key header ausente ou vazio' });
  }

  const ok = await isValidApiKey(apiKey);
  if (!ok) {
    return res.status(403).json({ message: 'apiKey inválida' });
  }

  next(); // autorizado
}
