import { NextRequest, NextResponse } from 'next/server';
import { signAdminCookie, ADMIN_COOKIE_NAME, COOKIE_MAX_AGE_SECONDS } from '@/lib/auth';
import { redirectUrl } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const password = form?.get('password') as string | null;
  const next = (form?.get('next') as string | null) ?? '/admin';

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.redirect(redirectUrl('/admin', request), { status: 303 });
  }

  if (!password || password !== adminPassword) {
    const url = redirectUrl('/admin/login', request);
    url.searchParams.set('error', '1');
    url.searchParams.set('next', next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const cookieValue = await signAdminCookie(adminPassword);
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
  const res = NextResponse.redirect(redirectUrl(safeNext, request), { status: 303 });
  res.cookies.set(ADMIN_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });
  return res;
}
