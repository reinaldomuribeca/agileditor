import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { JOBS_ROOT } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JOBS_DIR = JOBS_ROOT;

export async function GET() {
  try {
    const entries = await fs.readdir(JOBS_DIR).catch(() => []);
    const jobs = await Promise.all(
      entries.map(async (jobId) => {
        try {
          const metaPath = path.join(JOBS_DIR, jobId, 'metadata.json');
          const data = await fs.readFile(metaPath, 'utf-8');
          return JSON.parse(data);
        } catch { return null; }
      })
    );
    const sorted = jobs
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return NextResponse.json(sorted);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
