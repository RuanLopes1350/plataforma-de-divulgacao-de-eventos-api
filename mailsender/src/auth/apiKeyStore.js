// src/auth/apiKeyStore.js
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const STORE_PATH   = path.resolve('src', 'auth', 'apiKeys.json');
const SALT_ROUNDS  = 15;

/* utilidades internas */
async function load() {
  try {
    const data = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
async function save(keys) {
  await fs.writeFile(STORE_PATH, JSON.stringify(keys, null, 2));
}

/* --------- API pública --------- */

/** Cria nova chave e persiste o HASH */
export async function createApiKey(name = 'unnamed') {
  const apiKey = crypto.randomBytes(32).toString('hex');      // 64 chars
  const hash   = await bcrypt.hash(apiKey, SALT_ROUNDS);

  const keys = await load();
  keys.push({ name, hash, createdAt: new Date().toISOString() });
  await save(keys);

  return apiKey;                                              // plaintext!
}

/** Valida um apiKey recebido */
export async function isValidApiKey(apiKey) {
  const keys = await load();
  for (const { hash } of keys) {
    if (await bcrypt.compare(apiKey, hash)) return true;
  }
  return false;
}

/** Lista todas as chaves (name + createdAt) – _sem_ expor hashes */
export async function listApiKeys() {
  const keys = await load();
  return keys.map(({ name, createdAt }) => ({ name, createdAt }));
}

/** Remove a chave identificada por `name` – retorna _true_ se removida */
export async function deleteApiKey(name) {
  const keys = await load();
  const index = keys.findIndex(k => k.name === name);
  if (index === -1) return false;
  keys.splice(index, 1);
  await save(keys);
  return true;
}
