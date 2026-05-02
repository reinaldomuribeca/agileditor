/**
 * Single-password auth via signed cookie.
 *
 * Why: this is a single-user app. NextAuth + Postgres would be 1000 lines for what
 * a 30-day signed cookie does. The cookie payload is just an expiry timestamp; the
 * signature is HMAC-SHA256 with APP_PASSWORD as the key. Rotating APP_PASSWORD
 * invalidates every existing session — a feature, not a bug.
 *
 * Implemented with Web Crypto so the same module works in both Node 20 (route
 * handlers) and the Edge runtime (middleware).
 */

export const COOKIE_NAME       = 'agil_session';       // legacy single-password
export const ADMIN_COOKIE_NAME = 'agil_admin_session'; // admin panel
export const USER_COOKIE_NAME  = 'agil_user_session';  // per-user accounts
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function hmacHex(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const bytes = new Uint8Array(sig);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

/** Build a signed cookie value: `${expiryMs}.${hex(hmac(expiryMs, secret))}`. */
export async function signCookie(secret: string): Promise<string> {
  const exp = Date.now() + COOKIE_MAX_AGE_SECONDS * 1000;
  const payload = String(exp);
  const sig = await hmacHex(payload, secret);
  return `${payload}.${sig}`;
}

/** Verify a cookie value: signature matches and expiry hasn't passed. */
export async function verifyCookie(cookie: string, secret: string): Promise<boolean> {
  const dot = cookie.lastIndexOf('.');
  if (dot < 0) return false;
  const payload = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = await hmacHex(payload, secret);
  if (!constantTimeEqual(sig, expected)) return false;
  const exp = Number.parseInt(payload, 10);
  return Number.isFinite(exp) && Date.now() < exp;
}

/** Constant-time string compare to avoid timing leaks on signature check. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Admin session (separate cookie, uses ADMIN_PASSWORD env var) ─────────

/** Build a signed admin cookie: same scheme as the regular session. */
export async function signAdminCookie(secret: string): Promise<string> {
  return signCookie(secret);
}

/** Verify an admin cookie. */
export async function verifyAdminCookie(cookie: string, secret: string): Promise<boolean> {
  return verifyCookie(cookie, secret);
}

// ─── User session (carries userId in the payload) ────────────────────────

/**
 * Build a signed user session cookie:
 * `${expiryMs}:${userId}.${hex(hmac(expiryMs:userId, secret))}`.
 * The secret is the user's PBKDF2-hashed password stored in their profile,
 * so rotating the password automatically invalidates the session.
 */
export async function signUserCookie(userId: string, secret: string): Promise<string> {
  const exp = Date.now() + COOKIE_MAX_AGE_SECONDS * 1000;
  const payload = `${exp}:${userId}`;
  const sig = await hmacHex(payload, secret);
  return `${payload}.${sig}`;
}

/** Verify a user session cookie and return the userId if valid. */
export async function verifyUserCookie(cookie: string, secret: string): Promise<string | null> {
  const dot = cookie.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = await hmacHex(payload, secret);
  if (!constantTimeEqual(sig, expected)) return null;
  const [expStr, userId] = payload.split(':');
  const exp = Number.parseInt(expStr, 10);
  if (!Number.isFinite(exp) || Date.now() >= exp) return null;
  return userId ?? null;
}
