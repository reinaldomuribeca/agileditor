import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, ADMIN_COOKIE_NAME, verifyCookie, verifyAdminCookie } from '@/lib/auth';

/**
 * Edge middleware — gates app routes.
 *
 * Two separate auth domains:
 *  1. /admin/* + /api/admin/* → ADMIN_PASSWORD (admin cookie)
 *  2. everything else          → APP_PASSWORD  (regular session cookie)
 *
 * When the relevant password env var is unset, that domain is open (dev mode).
 */

const PUBLIC_EXACT = new Set([
  '/login',
  '/api/login',
  '/api/logout',
  '/api/health',
  '/favicon.ico',
  '/admin/login',
  '/api/admin/login',
  '/api/admin/logout',
]);

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Always public
  if (PUBLIC_EXACT.has(path)) return NextResponse.next();

  // ── Admin domain ─────────────────────────────────────────────────────────
  const isAdminPage = path.startsWith('/admin');
  const isAdminApi  = path.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return NextResponse.next(); // dev mode

    const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const authed = cookie ? await verifyAdminCookie(cookie, adminPassword) : false;
    if (authed) return NextResponse.next();

    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', path + (req.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }

  // ── Regular user domain ───────────────────────────────────────────────────
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return NextResponse.next(); // dev mode

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

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
