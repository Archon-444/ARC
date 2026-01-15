import crypto from 'crypto';
import { kv } from '@vercel/kv';

type CircleTokenRecord = {
  userId: string;
  userToken: string;
  encryptionKey: string;
  refreshToken?: string;
  deviceId?: string;
  expiresAt: number;
  updatedAt: number;
};

type EncryptedTokenRecord = {
  userId: string;
  userToken: string;
  encryptionKey: string;
  refreshToken?: string;
  deviceId?: string;
  expiresAt: number;
  updatedAt: number;
};

const ENCRYPTION_KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY;
const IV_LENGTH = 16;
const TOKEN_PREFIX = 'circle:tokens';

function getEncryptionKey() {
  if (!ENCRYPTION_KEY_HEX) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured');
  }
  const key = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes hex (64 chars)');
  }
  return key;
}

function encrypt(value: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(value: string) {
  const [ivHex, encryptedHex] = value.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted value');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

function buildKey(userId: string) {
  return `${TOKEN_PREFIX}:${userId}`;
}

export async function storeCircleTokens(record: CircleTokenRecord) {
  const encryptedRecord: EncryptedTokenRecord = {
    userId: record.userId,
    userToken: encrypt(record.userToken),
    encryptionKey: encrypt(record.encryptionKey),
    refreshToken: record.refreshToken ? encrypt(record.refreshToken) : undefined,
    deviceId: record.deviceId,
    expiresAt: record.expiresAt,
    updatedAt: record.updatedAt,
  };

  const ttlSeconds = Math.max(Math.ceil((record.expiresAt - Date.now()) / 1000), 1);
  await kv.set(buildKey(record.userId), JSON.stringify(encryptedRecord), { ex: ttlSeconds });
}

export async function getCircleTokens(userId: string) {
  const record = await kv.get<string>(buildKey(userId));
  if (!record) return null;
  const parsed = JSON.parse(record) as EncryptedTokenRecord;
  if (Date.now() >= parsed.expiresAt) {
    await kv.del(buildKey(userId));
    return null;
  }

  return {
    userId: parsed.userId,
    userToken: decrypt(parsed.userToken),
    encryptionKey: decrypt(parsed.encryptionKey),
    refreshToken: parsed.refreshToken ? decrypt(parsed.refreshToken) : undefined,
    deviceId: parsed.deviceId,
    expiresAt: parsed.expiresAt,
    updatedAt: parsed.updatedAt,
  };
}

export async function clearCircleTokens(userId: string) {
  await kv.del(buildKey(userId));
}

export function isTokenVaultEnabled() {
  return process.env.CIRCLE_TOKEN_VAULT_MODE === 'server';
}
