import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS, signCookie } from '@/lib/auth';
import { redirectUrl } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    return NextResponse.redirect(redirectUrl('/', req), { status: 303 });
  }

  const form = await req.formData();
  const submitted = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '/');

  if (submitted !== password) {
    const url = redirectUrl('/login', req);
    url.searchParams.set('error', '1');
    if (next && next !== '/') url.searchParams.set('next', next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const cookieValue = await signCookie(password);
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
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
