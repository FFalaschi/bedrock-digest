import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function encryptionKey(): Buffer {
  const k = process.env.EMAIL_ENCRYPTION_KEY;
  if (!k) throw new Error("EMAIL_ENCRYPTION_KEY not set");
  const buf = Buffer.from(k, "hex");
  if (buf.length !== 32) throw new Error("EMAIL_ENCRYPTION_KEY must be 32 bytes hex");
  return buf;
}

function hmacSecret(): string {
  const s = process.env.EMAIL_HMAC_SECRET;
  if (!s) throw new Error("EMAIL_HMAC_SECRET not set");
  return s;
}

// Returns "iv:tag:ciphertext" all base64, colon-delimited
export function encryptEmail(email: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(email, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

export function decryptEmail(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted email format");
  const [ivB64, tagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64!, "base64");
  const tag = Buffer.from(tagB64!, "base64");
  const ciphertext = Buffer.from(ciphertextB64!, "base64");
  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}

// Deterministic HMAC hash for deduplication lookups
export function hashEmail(email: string): string {
  return createHmac("sha256", hmacSecret())
    .update(email.toLowerCase().trim())
    .digest("hex");
}

// Returns 64-char hex token — send this in emails
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// SHA-256 of the raw token — store this in the DB
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
