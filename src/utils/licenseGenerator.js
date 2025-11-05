import fs from 'fs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, 'utf8');

// Función para generar el código corto legible
function generateShortCode() {
  const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 caracteres hex
  // lo convertimos a formato tipo ABC12-DEF34
  return raw.match(/.{1,5}/g).join('-');
}

export function generateOfflineLicense({ userId, email, machineId, type = 'LOCAL', expiresIn = '10y' }) {
  const payload = { sub: userId, email, machineId, type };
  const token = jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256', expiresIn });
  const shortCode = generateShortCode();
  return { token, shortCode };
}
