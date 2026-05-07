import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let cachedKey: Buffer | null = null;

export const getEncryptionKey = (): Buffer => {
  if (cachedKey) return cachedKey;
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY environment variable is not set");
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  cachedKey = key;
  return key;
};

export const encrypt = (plaintext: string): string => {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
};

export const decrypt = (ciphertext: string): string => {
  const key = getEncryptionKey();
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ct = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
};

export const encryptJson = <T>(value: T): string => encrypt(JSON.stringify(value));
export const decryptJson = <T>(ciphertext: string): T => JSON.parse(decrypt(ciphertext)) as T;

export const timingSafeEquals = (a: string, b: string): boolean => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
};

export const hashIp = (ip: string | null | undefined): string | null => {
  if (!ip || typeof ip !== "string") return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
};

export const signWebhookBody = (secret: string, timestamp: string, body: string): string =>
  createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

export const verifyWebhookSignature = (
  secret: string,
  timestamp: string,
  body: string,
  signature: string,
  maxSkewSeconds = 300,
): boolean => {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const skew = Math.abs(Date.now() / 1000 - ts);
  if (skew > maxSkewSeconds) return false;
  return timingSafeEquals(signWebhookBody(secret, timestamp, body), signature);
};
