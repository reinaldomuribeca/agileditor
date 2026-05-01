import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ensureJobDir, saveJobMetadata } from '@/lib/storage';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import type { CutMode, CutAggressiveness } from '@/lib/types';

const ALLOWED_MODES = new Set<CutMode>(['none', 'speech', 'scene', 'ai']);
const ALLOWED_AGGR = new Set<CutAggressiveness>(['subtle', 'balanced', 'aggressive']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_VIDEO_SIZE_MB = Number(process.env.MAX_VIDEO_SIZE_MB ?? '200');
const MAX_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 uploads per minute per IP.
    const ip = clientIp(request);
    const rl = rateLimit(`upload:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many uploads. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      );
    }

    // Reject oversized payloads BEFORE buffering them — based on Content-Length.
    const contentLength = Number(request.headers.get('content-length') ?? '0');
    if (contentLength > MAX_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo ${MAX_VIDEO_SIZE_MB} MB.` },
        { status: 413 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prompt = (formData.get('prompt') as string) || '';
    const legendar = (formData.get('legendar') as string) !== 'false';
    const animator = (formData.get('animator') as string) !== 'false';

    const rawCutMode = (formData.get('cutMode') as string) ?? 'speech';
    const rawAggr = (formData.get('cutAggressiveness') as string) ?? 'balanced';
    const cutMode: CutMode = ALLOWED_MODES.has(rawCutMode as CutMode) ? (rawCutMode as CutMode) : 'speech';
    const cutAggressiveness: CutAggressiveness = ALLOWED_AGGR.has(rawAggr as CutAggressiveness) ? (rawAggr as CutAggressiveness) : 'balanced';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    // Second check on actual file size (Content-Length can lie or be absent).
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo ${MAX_VIDEO_SIZE_MB} MB.` },
        { status: 413 },
      );
    }

    const jobId = uuidv4();
    console.log(`Creating job ${jobId}...`);

    try {
      const jobDir = await ensureJobDir(jobId);
      console.log(`Job directory created: ${jobDir}`);

      // Save the video file
      const bytes = await file.arrayBuffer();
      const videoPath = path.join(jobDir, 'raw.mp4');
      await writeFile(videoPath, Buffer.from(bytes));
      console.log(`Video saved: ${videoPath}`);

      // Save job metadata
      const metadata = {
        id: jobId,
        status: 'normalizing' as const,
        prompt: prompt || undefined,
        videoPath,
        legendar,
        animator,
        cutMode,
        cutAggressiveness,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveJobMetadata(jobId, metadata);
      console.log(`Job metadata saved for ${jobId}`);

      return NextResponse.json({
        jobId,
        success: true,
        message: 'Upload successful, starting processing...',
      });
    } catch (storageError) {
      console.error('Storage error:', storageError);
      throw new Error(
        `Failed to save job: ${(storageError as Error).message}`
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
