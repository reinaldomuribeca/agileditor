import { NextRequest, NextResponse } from 'next/server';
import { getJobMetadata } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('id');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 });
    }

    const job = await getJobMetadata(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}
