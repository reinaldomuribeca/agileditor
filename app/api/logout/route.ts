import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, USER_COOKIE_NAME } from '@/lib/auth';
import { redirectUrl } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(redirectUrl('/login', req), { status: 303 });
  res.cookies.set(COOKIE_NAME,      '', { maxAge: 0, path: '/' });
  res.cookies.set(USER_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
