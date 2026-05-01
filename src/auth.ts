import { promisify } from 'node:util';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { Result } from './types.js';

const scryptAsync = promisify(scrypt);

interface StoredUser {
  id: string;
  username: string;
  hash: Buffer;
  salt: string;
}

export interface AuthUser {
  id: string;
  username: string;
}

const users = new Map<string, StoredUser>();

async function deriveKey(password: string, salt: string): Promise<Buffer> {
  return scryptAsync(password, salt, 64) as Promise<Buffer>;
}

export async function register(
  username: string,
  password: string,
): Promise<Result<AuthUser, string>> {
  if (users.has(username)) {
    return { ok: false, error: 'Username already taken' };
  }
  const salt = randomBytes(16).toString('hex');
  const hash = await deriveKey(password, salt);
  const id = randomBytes(8).toString('hex');
  users.set(username, { id, username, hash, salt });
  return { ok: true, value: { id, username } };
}

export async function login(
  username: string,
  password: string,
): Promise<Result<AuthUser, string>> {
  const user = users.get(username);
  if (!user) {
    // Derive key anyway to avoid timing-based username enumeration
    await deriveKey(password, 'dummy-salt');
    return { ok: false, error: 'Invalid credentials' };
  }
  const hash = await deriveKey(password, user.salt);
  if (!timingSafeEqual(hash, user.hash)) {
    return { ok: false, error: 'Invalid credentials' };
  }
  return { ok: true, value: { id: user.id, username: user.username } };
}
