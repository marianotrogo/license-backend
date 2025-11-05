// src/generateKeys.js
import fs from "fs";
import path from "path";
import { generateKeyPairSync } from "crypto";

const dir = path.resolve("src/keys");

// Crear carpeta /keys si no existe
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Generar par de claves RSA (privada + pública)
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

// Guardar en archivos
fs.writeFileSync(path.join(dir, "private.pem"), privateKey);
fs.writeFileSync(path.join(dir, "public.pem"), publicKey);

console.log("✅ Claves generadas correctamente en src/keys/");
