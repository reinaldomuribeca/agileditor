import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  USER_COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  signCookie,
  signUserCookie,
} from '@/lib/auth';
import { redirectUrl } from '@/lib/utils';
import { getUserByEmail, verifyPassword } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const next = String(form.get('next') ?? '/app');
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/app';

  const userSecret = process.env.USER_SESSION_SECRET;

  // ── User-account mode (USER_SESSION_SECRET set) ───────────────────────────
  if (userSecret) {
    const email    = String(form.get('email') ?? '').toLowerCase().trim();
    const password = String(form.get('password') ?? '');

    const failUrl = redirectUrl('/login', req);
    failUrl.searchParams.set('error', '1');
    if (safeNext !== '/app') failUrl.searchParams.set('next', safeNext);

    if (!email || !password) return NextResponse.redirect(failUrl, { status: 303 });

    const user = await getUserByEmail(email).catch(() => null);
    if (!user || user.status !== 'active') return NextResponse.redirect(failUrl, { status: 303 });

    const ok = await verifyPassword(password, user.passwordHash).catch(() => false);
    if (!ok) return NextResponse.redirect(failUrl, { status: 303 });

    const cookieValue = await signUserCookie(user.id, userSecret);
    const res = NextResponse.redirect(redirectUrl(safeNext, req), { status: 303 });
    res.cookies.set(USER_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: '/',
    });
    return res;
  }

  // ── Legacy single-password mode (APP_PASSWORD only) ───────────────────────
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.redirect(redirectUrl('/app', req), { status: 303 });
  }

  const submitted = String(form.get('password') ?? '');
  if (submitted !== appPassword) {
    const url = redirectUrl('/login', req);
    url.searchParams.set('error', '1');
    if (safeNext !== '/app') url.searchParams.set('next', safeNext);
    return NextResponse.redirect(url, { status: 303 });
  }

  const cookieValue = await signCookie(appPassword);
  const res = NextResponse.redirect(redirectUrl(safeNext, req), { status: 303 });
  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });
  return res;
}
