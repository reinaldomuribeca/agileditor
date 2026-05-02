import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  USER_COOKIE_NAME,
  verifyCookie,
  verifyAdminCookie,
  verifyUserCookie,
} from '@/lib/auth';

/**
 * Auth tiers:
 *
 * 1. PUBLIC — no auth needed (sales page, login, health)
 * 2. ADMIN  — /admin/* and /api/admin/* → ADMIN_PASSWORD cookie
 * 3. USER   — /app, /editor/*, /gallery, /api/* (protected) →
 *      a. USER_SESSION_SECRET set → agil_user_session (per-user account)
 *      b. ADMIN cookie also grants access (owner always has access)
 *      c. Fallback: APP_PASSWORD (legacy single-password mode)
 *
 * If none of the auth env vars are set → open (dev mode).
 */

const PUBLIC_EXACT = new Set([
  '/',
  '/home',
  '/login',
  '/register',
  '/api/login',
  '/api/logout',
  '/api/register',
  '/api/health',
  '/api/version',
  '/api/bust',
  '/admin/login',
  '/api/admin/login',
  '/api/admin/logout',
]);

const PUBLIC_PREFIX = ['/favicon', '/_next'];

function isPublic(path: string): boolean {
  if (PUBLIC_EXACT.has(path)) return true;
  if (PUBLIC_PREFIX.some((p) => path.startsWith(p))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Rewrite / → /home so landing page always bypasses the cached root route
  if (path === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.rewrite(url);
  }

  if (isPublic(path)) return NextResponse.next();

  // ── Admin domain ─────────────────────────────────────────────────────────
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return NextResponse.next();

    const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const authed = cookie ? await verifyAdminCookie(cookie, adminPassword) : false;
    if (authed) return NextResponse.next();

    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', path + (req.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }

  // ── Protected user domain ─────────────────────────────────────────────────
  const userSecret   = process.env.USER_SESSION_SECRET;
  const appPassword  = process.env.APP_PASSWORD;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Dev mode: no env vars set → open
  if (!userSecret && !appPassword) return NextResponse.next();

  // Check if caller has a valid admin cookie (owner always gets through)
  if (adminPassword) {
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (adminCookie && await verifyAdminCookie(adminCookie, adminPassword)) {
      return NextResponse.next();
    }
  }

  // Check user session (preferred when USER_SESSION_SECRET is set)
  if (userSecret) {
    const userCookie = req.cookies.get(USER_COOKIE_NAME)?.value;
    const userId = userCookie ? await verifyUserCookie(userCookie, userSecret) : null;
    if (userId) return NextResponse.next();

    // Not authed → redirect or 401
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path + (req.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }

  // Legacy single-password fallback (APP_PASSWORD only, no USER_SESSION_SECRET)
  if (appPassword) {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    const authed = cookie ? await verifyCookie(cookie, appPassword) : false;
    if (authed) return NextResponse.next();

    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path + (req.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
