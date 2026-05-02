import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(_request: NextRequest) {
  const res = NextResponse.redirect(new URL('/admin/login', _request.url));
  res.cookies.set(ADMIN_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
