import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifyCookie } from '@/lib/auth';

/**
 * Edge middleware: gates the entire app behind APP_PASSWORD.
 *
 * - When APP_PASSWORD is unset → auth is OFF (dev mode); pass everything.
 * - Public paths (/login, /api/login, /api/logout, /api/health) always pass.
 * - /api/* unauthorized → JSON 401.
 * - Page unauthorized → 302 redirect to /login?next=<original-path>.
 */

const PUBLIC_EXACT = new Set([
  '/login',
  '/api/login',
  '/api/logout',
  '/api/health',
  '/favicon.ico',
]);

export async function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const path = req.nextUrl.pathname;

  // Always-public routes
  if (PUBLIC_EXACT.has(path)) return NextResponse.next();

  // Cookie check
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const authed = cookie ? await verifyCookie(cookie, password) : false;
  if (authed) return NextResponse.next();

  // Unauthorized: API routes get 401 JSON, pages redirect to /login
  if (path.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', path + (req.nextUrl.search || ''));
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals and Next/image optimizations.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
