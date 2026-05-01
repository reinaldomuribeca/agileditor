import { NextRequest, NextResponse } from 'next/server';
import { getJobMetadata, saveJobMetadata, getJobFilePath } from '@/lib/storage';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const FFMPEG_BIN: string = ffmpegInstaller.path;

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large videos

/**
 * Normalize video using raw child_process.spawn.
 * Avoids fluent-ffmpeg which can hang when stderr buffer fills up.
 */
function normalizeVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',                           // overwrite output
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',          // 5–10× faster than 'fast'
      '-crf', '23',
      '-r', '30',                      // CFR 30fps
      '-pix_fmt', 'yuv420p',          // ensure broad compatibility
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',                  // standard sample rate for Whisper
      '-movflags', '+faststart',
      outputPath,
    ];

    console.log('[normalize] spawn:', FFMPEG_BIN, args.slice(0, 6).join(' '), '...');
    const proc = spawn(FFMPEG_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    // CRITICAL: continuously drain stdout/stderr to prevent kernel buffer overflow
    let stderrTail = '';
    proc.stdout.on('data', () => { /* drain */ });
    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-2000); // keep last 2KB for diagnostics

      // Log progress lines (frame=... time=...)
      const m = text.match(/frame=\s*(\d+).*?time=(\S+)/);
      if (m) console.log(`[ffmpeg] frame=${m[1]} time=${m[2]}`);
    });

    proc.on('error', (err) => {
      console.error('[normalize] spawn error:', err);
      reject(err);
    });

    proc.on('close', (code, signal) => {
      if (code === 0) {
        console.log('[normalize] ffmpeg closed cleanly');
        resolve();
      } else {
        const reason = signal ? `signal ${signal}` : `exit code ${code}`;
        console.error(`[normalize] ffmpeg ${reason}\n${stderrTail.slice(-800)}`);
        reject(new Error(`ffmpeg failed (${reason}): ${stderrTail.slice(-300)}`));
      }
    });
  });
}

/**
 * Get video duration by parsing ffmpeg -i stderr output.
 * Avoids ffprobe (not bundled with @ffmpeg-installer).
 */
function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, ['-i', filePath, '-hide_banner'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    proc.stdout.on('data', () => {});
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('error', reject);
    proc.on('close', () => {
      // ffmpeg -i exits with code 1 (no output specified) — that's expected
      const match = stderr.match(/Duration:\s+(\d+):(\d+):(\d+\.?\d*)/);
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const s = parseFloat(match[3]);
        resolve(h * 3600 + m * 60 + s);
      } else {
        reject(new Error(`Could not parse duration. stderr: ${stderr.slice(0, 400)}`));
      }
    });
  });
}

export async function POST(request: NextRequest) {
  let jobId: string | undefined;
  const startTime = Date.now();

  try {
    const body = await request.json();
    jobId = body.jobId;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const job = await getJobMetadata(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (!job.videoPath) {
      return NextResponse.json({ error: 'Missing videoPath in job' }, { status: 400 });
    }

    // Verify the source file actually exists
    try {
      const stat = await fs.stat(job.videoPath);
      if (stat.size === 0) {
        throw new Error('Source video file is empty');
      }
      console.log(`[normalize] source: ${job.videoPath} (${(stat.size / 1_048_576).toFixed(1)} MB)`);
    } catch (err) {
      throw new Error(`Source video not accessible: ${(err as Error).message}`);
    }

    // Idempotency: skip if already normalized
    if (job.normalizedPath) {
      try {
        await fs.access(job.normalizedPath);
        console.log(`[normalize] already done for ${jobId}, skipping`);
        if (job.status === 'normalizing') {
          await saveJobMetadata(jobId, { status: 'transcribing' });
        }
        return NextResponse.json({ success: true, skipped: true });
      } catch {
        // File doesn't exist, re-run
      }
    }

    const normalizedPath = await getJobFilePath(jobId, 'normalized.mp4');
    console.log(`[normalize] starting ${jobId} → ${normalizedPath}`);

    await normalizeVideo(job.videoPath, normalizedPath);

    const stat = await fs.stat(normalizedPath);
    if (stat.size === 0) {
      throw new Error('Normalized output file is empty');
    }
    console.log(`[normalize] output: ${(stat.size / 1_048_576).toFixed(1)} MB`);

    const duration = await getVideoDuration(normalizedPath);
    console.log(`[normalize] duration: ${duration.toFixed(2)}s`);

    // Hard cap on duration. Whisper has a 24MB audio limit (~50 min @ 64kbps mono),
    // and Claude tokens scale with transcript length. Default 600s = 10min keeps
    // both bounded. Override with MAX_VIDEO_DURATION_SECONDS.
    const maxDur = Number(process.env.MAX_VIDEO_DURATION_SECONDS ?? '600');
    if (Number.isFinite(maxDur) && maxDur > 0 && duration > maxDur) {
      throw new Error(
        `Vídeo muito longo: ${duration.toFixed(0)}s (máximo ${maxDur}s).`,
      );
    }

    await saveJobMetadata(jobId, {
      status: 'transcribing',
      normalizedPath,
      duration: Math.round(duration),
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✓ Normalized ${jobId} in ${elapsed}s (${Math.round(duration)}s video)`);

    return NextResponse.json({ success: true, normalizedPath, duration });

  } catch (error) {
    const msg = (error as Error).message ?? String(error);
    console.error('[normalize] FAILED:', msg);

    if (jobId) {
      await saveJobMetadata(jobId, {
        status: 'error',
        errorMessage: `Normalize failed: ${msg.slice(0, 500)}`,
      });
    }

    return NextResponse.json(
      { error: 'Normalization failed', details: msg },
      { status: 500 }
    );
  }
}
