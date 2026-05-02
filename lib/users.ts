import fs from 'fs/promises';
import path from 'path';
import type { User, UserPlan, UserStatus, UserLimits } from './types';

const USERS_DIR = process.env.USERS_DIR
  ? path.resolve(process.env.USERS_DIR)
  : path.resolve(process.cwd(), 'data', 'users');

const PLAN_DEFAULTS: Record<UserPlan, UserLimits> = {
  free:       { videosPerMonth: 5,   maxVideoDurationSecs: 120,  maxStorageMB: 500 },
  starter:    { videosPerMonth: 30,  maxVideoDurationSecs: 600,  maxStorageMB: 2048 },
  pro:        { videosPerMonth: 150, maxVideoDurationSecs: 1800, maxStorageMB: 10240 },
  enterprise: { videosPerMonth: 999, maxVideoDurationSecs: 7200, maxStorageMB: 51200 },
};

export function getPlanLimits(user: User): UserLimits {
  return { ...PLAN_DEFAULTS[user.plan], ...user.limits };
}

async function ensureUsersDir() {
  await fs.mkdir(USERS_DIR, { recursive: true });
}

function userPath(userId: string) {
  return path.join(USERS_DIR, `${userId}.json`);
}

// ─── Password hashing (PBKDF2 via Web Crypto) ─────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = Buffer.from(saltBytes).toString('hex');

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const hashBuf = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const hash = Buffer.from(hashBuf).toString('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;

  const saltBytes = Buffer.from(saltHex, 'hex');
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const hashBuf = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const candidate = Buffer.from(hashBuf).toString('hex');

  // Constant-time compare
  if (candidate.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return diff === 0;
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export async function createUser(params: {
  email: string;
  name: string;
  password: string;
  plan?: UserPlan;
  status?: UserStatus;
  notes?: string;
}): Promise<User> {
  await ensureUsersDir();

  const existing = await getUserByEmail(params.email);
  if (existing) throw new Error(`E-mail já cadastrado: ${params.email}`);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const user: User = {
    id,
    email: params.email.toLowerCase().trim(),
    name: params.name.trim(),
    plan: params.plan ?? 'free',
    status: params.status ?? 'active',
    passwordHash: await hashPassword(params.password),
    createdAt: now,
    updatedAt: now,
    notes: params.notes,
  };

  await fs.writeFile(userPath(id), JSON.stringify(user, null, 2));
  return user;
}

export async function listUsers(): Promise<User[]> {
  await ensureUsersDir();
  const files = await fs.readdir(USERS_DIR).catch(() => [] as string[]);
  const users: User[] = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(USERS_DIR, f), 'utf-8');
      users.push(JSON.parse(raw));
    } catch {
      // skip corrupt file
    }
  }
  return users.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const raw = await fs.readFile(userPath(id), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const lower = email.toLowerCase().trim();
  const users = await listUsers();
  return users.find((u) => u.email === lower) ?? null;
}

export async function updateUser(id: string, patch: Partial<Omit<User, 'id' | 'createdAt' | 'passwordHash'>>): Promise<User> {
  const user = await getUserById(id);
  if (!user) throw new Error(`Usuário não encontrado: ${id}`);
  const updated: User = { ...user, ...patch, id, updatedAt: new Date().toISOString() };
  await fs.writeFile(userPath(id), JSON.stringify(updated, null, 2));
  return updated;
}

export async function updateUserPassword(id: string, newPassword: string): Promise<void> {
  const user = await getUserById(id);
  if (!user) throw new Error(`Usuário não encontrado: ${id}`);
  const updated: User = { ...user, passwordHash: await hashPassword(newPassword), updatedAt: new Date().toISOString() };
  await fs.writeFile(userPath(id), JSON.stringify(updated, null, 2));
}

export async function deleteUser(id: string): Promise<void> {
  await fs.unlink(userPath(id)).catch(() => {});
}
