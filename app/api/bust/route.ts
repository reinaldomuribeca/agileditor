import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  revalidatePath('/', 'page');
  revalidatePath('/', 'layout');
  return NextResponse.json({ busted: true, ts: Date.now() });
}
