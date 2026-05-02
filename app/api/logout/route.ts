import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, USER_COOKIE_NAME, ADMIN_COOKIE_NAME } from '@/lib/auth';
import { redirectUrl } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLEAR = {
  value: '',
  maxAge: 0,
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
};

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(redirectUrl('/login', req), { status: 303 });
  res.cookies.set(COOKIE_NAME,       CLEAR.value, CLEAR);
  res.cookies.set(USER_COOKIE_NAME,  CLEAR.value, CLEAR);
  res.cookies.set(ADMIN_COOKIE_NAME, CLEAR.value, CLEAR);
  return res;
}
