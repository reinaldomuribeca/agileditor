import { NextRequest, NextResponse } from 'next/server';
import { signAdminCookie, ADMIN_COOKIE_NAME, COOKIE_MAX_AGE_SECONDS } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const password = form?.get('password') as string | null;
  const next = (form?.get('next') as string | null) ?? '/admin';

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    // Dev mode: no password required
    const res = NextResponse.redirect(new URL(next, request.url));
    return res;
  }

  if (!password || password !== adminPassword) {
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('error', '1');
    url.searchParams.set('next', next);
    return NextResponse.redirect(url);
  }

  const cookieValue = await signAdminCookie(adminPassword);
  const res = NextResponse.redirect(new URL(next, request.url));
  res.cookies.set(ADMIN_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });
  return res;
}
