import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Los tokens de Gmail son credenciales sensibles (permiten enviar mail como
// LUMO): se cifran en reposo con AES-256-GCM antes de guardarlos en la tabla
// gmail_tokens. La clave se deriva de GMAIL_TOKEN_ENCRYPTION_KEY (cualquier
// string sirve, se hashea a 32 bytes) para no exigir un formato exacto.
function getKey(): Buffer {
  const secret = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("Falta GMAIL_TOKEN_ENCRYPTION_KEY en las variables de entorno");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptToken(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
