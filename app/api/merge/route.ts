import { NextRequest, NextResponse } from 'next/server';
import { getJobMetadata, saveJobMetadata, getJobFilePath } from '@/lib/storage';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const FFMPEG_BIN: string = ffmpegInstaller.path;

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Merge N video files into one using FFmpeg filter_complex concat.
 * Re-encodes to H.264/AAC so different source formats/codecs are handled.
 */
function mergeVideos(inputPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const n = inputPaths.length;
    const inputArgs = inputPaths.flatMap((p) => ['-i', p]);

    // [0:v][0:a][1:v][1:a]...concat=n=N:v=1:a=1[v][a]
    const segments = Array.from({ length: n }, (_, i) => `[${i}:v][${i}:a]`).join('');
    const filterComplex = `${segments}concat=n=${n}:v=1:a=1[v][a]`;

    const args = [
      '-y',
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '[v]',
      '-map', '[a]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-movflags', '+faststart',
      outputPath,
    ];

    console.log('[merge] spawn ffmpeg with', n, 'inputs');
    const proc = spawn(FFMPEG_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderrTail = '';
    proc.stdout.on('data', () => { /* drain */ });
    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-2000);
      const m = text.match(/frame=\s*(\d+).*?time=(\S+)/);
      if (m) console.log(`[merge-ffmpeg] frame=${m[1]} time=${m[2]}`);
    });

    proc.on('error', (err) => {
      console.error('[merge] spawn error:', err);
      reject(err);
    });

    proc.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const reason = signal ? `signal ${signal}` : `exit code ${code}`;
        console.error(`[merge] ffmpeg ${reason}\n${stderrTail.slice(-800)}`);
        reject(new Error(`ffmpeg merge failed (${reason}): ${stderrTail.slice(-300)}`));
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

    // Idempotency: skip if already past merging.
    if (job.status !== 'merging') {
      console.log(`[merge] job ${jobId} status=${job.status}, skipping`);
      return NextResponse.json({ success: true, skipped: true });
    }

    if (!job.rawPaths || job.rawPaths.length < 2) {
      return NextResponse.json(
        { error: 'Job does not have multiple raw paths to merge' },
        { status: 400 },
      );
    }

    // Verify all source files exist and are non-empty.
    for (const p of job.rawPaths) {
      const stat = await fs.stat(p).catch(() => null);
      if (!stat || stat.size === 0) {
        throw new Error(`Arquivo de origem ausente ou vazio: ${p}`);
      }
    }

    const outputPath = await getJobFilePath(jobId, 'raw.mp4');
    console.log(`[merge] joining ${job.rawPaths.length} videos → ${outputPath}`);

    await mergeVideos(job.rawPaths, outputPath);

    const stat = await fs.stat(outputPath);
    if (stat.size === 0) throw new Error('Merged output file is empty');

    await saveJobMetadata(jobId, {
      status: 'normalizing',
      videoPath: outputPath,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✓ Merged ${job.rawPaths.length} videos for ${jobId} in ${elapsed}s`);

    return NextResponse.json({ success: true, videoPath: outputPath });

  } catch (error) {
    const msg = (error as Error).message ?? String(error);
    console.error('[merge] FAILED:', msg);

    if (jobId) {
      await saveJobMetadata(jobId, {
        status: 'error',
        errorMessage: `Merge de vídeos falhou: ${msg.slice(0, 500)}`,
      });
    }

    return NextResponse.json(
      { error: 'Merge failed', details: msg },
      { status: 500 },
    );
  }
}
