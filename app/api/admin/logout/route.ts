import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth';
import { redirectUrl } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(redirectUrl('/admin/login', request), { status: 303 });
  res.cookies.set(ADMIN_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
