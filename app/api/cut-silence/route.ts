import { NextRequest, NextResponse } from 'next/server';
import { getJobMetadata, saveJobMetadata, getJobFilePath } from '@/lib/storage';
import { computeKeepSegments, shiftSubtitles, totalRemovedSeconds } from '@/lib/silence';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const FFMPEG_BIN: string = ffmpegInstaller.path;

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const MIN_GAP_SECONDS = 0.8;
const PADDING_SECONDS = 0.05;

/**
 * Build the ffmpeg `filter_complex` string that trims and concats N keep-segments.
 * One trim+atrim per segment, then a final concat filter.
 */
function buildFilterComplex(segments: { start: number; end: number }[]): string {
  const parts: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const { start, end } = segments[i];
    parts.push(
      `[0:v]trim=start=${start.toFixed(3)}:end=${end.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`,
    );
    parts.push(
      `[0:a]atrim=start=${start.toFixed(3)}:end=${end.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`,
    );
  }
  const inputs = segments.map((_, i) => `[v${i}][a${i}]`).join('');
  parts.push(`${inputs}concat=n=${segments.length}:v=1:a=1[outv][outa]`);
  return parts.join(';');
}

function runFfmpegCut(
  inputPath: string,
  outputPath: string,
  segments: { start: number; end: number }[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const filter = buildFilterComplex(segments);
    const args = [
      '-y',
      '-i', inputPath,
      '-filter_complex', filter,
      '-map', '[outv]',
      '-map', '[outa]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-r', '30',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-movflags', '+faststart',
      outputPath,
    ];

    console.log(`[cut-silence] spawn ffmpeg, ${segments.length} keep-segments, filter length=${filter.length}`);
    const proc = spawn(FFMPEG_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderrTail = '';
    proc.stdout.on('data', () => {});
    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-2000);
      const m = text.match(/frame=\s*(\d+).*?time=(\S+)/);
      if (m) console.log(`[cut-silence] frame=${m[1]} time=${m[2]}`);
    });

    proc.on('error', reject);
    proc.on('close', (code, signal) => {
      if (code === 0) {
        console.log('[cut-silence] ffmpeg closed cleanly');
        resolve();
      } else {
        const reason = signal ? `signal ${signal}` : `exit code ${code}`;
        reject(new Error(`ffmpeg failed (${reason}): ${stderrTail.slice(-300)}`));
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
    if (!job.normalizedPath) {
      return NextResponse.json({ error: 'Job not yet normalized' }, { status: 400 });
    }
    if (!job.subtitles || job.subtitles.length === 0) {
      return NextResponse.json({ error: 'Job not yet transcribed' }, { status: 400 });
    }

    // Idempotency: skip if cut.mp4 already exists and metadata reflects it.
    const cutPath = await getJobFilePath(jobId, 'cut.mp4');
    if (job.cutPath && job.subtitlesCut && job.subtitlesCut.length > 0) {
      try {
        await fs.access(cutPath);
        console.log(`[cut-silence] already done for ${jobId}, skipping`);
        if (job.status === 'cutting-silence') {
          await saveJobMetadata(jobId, { status: 'analyzing' });
        }
        return NextResponse.json({
          success: true,
          skipped: true,
          cutPath: job.cutPath,
          removedSeconds: job.silenceCutSeconds ?? 0,
        });
      } catch {
        // cut.mp4 missing — fall through and re-cut
      }
    }

    // Compute keep segments from subtitle timestamps.
    const keepSegments = computeKeepSegments(job.subtitles, {
      paddingStart: PADDING_SECONDS,
      paddingEnd: PADDING_SECONDS,
      minGap: MIN_GAP_SECONDS,
      totalDuration: job.duration,
    });

    if (keepSegments.length === 0) {
      throw new Error('No keep-segments computed; subtitles list may be empty.');
    }

    const originalDuration = job.duration ?? keepSegments[keepSegments.length - 1].end;
    const removedSeconds = totalRemovedSeconds(keepSegments, originalDuration);

    console.log(
      `[cut-silence] keep_segments=${keepSegments.length} removed=${removedSeconds.toFixed(2)}s ` +
      `original=${originalDuration.toFixed(2)}s minGap=${MIN_GAP_SECONDS}`,
    );

    // If essentially nothing to cut, just symlink-equivalent: copy normalized.mp4 → cut.mp4
    // and shift subs (which will be a no-op except for index renumbering).
    if (removedSeconds < 0.1) {
      console.log('[cut-silence] removedSeconds < 0.1, skipping ffmpeg and copying normalized.mp4');
      await fs.copyFile(job.normalizedPath, cutPath);
    } else {
      await runFfmpegCut(
        job.normalizedPath,
        cutPath,
        keepSegments.map((s) => ({ start: s.start, end: s.end })),
      );
    }

    const stat = await fs.stat(cutPath);
    if (stat.size === 0) {
      throw new Error('cut.mp4 output file is empty');
    }

    const subtitlesCut = shiftSubtitles(job.subtitles, keepSegments);
    const finalDuration = subtitlesCut.length > 0
      ? subtitlesCut[subtitlesCut.length - 1].end
      : Math.max(0, originalDuration - removedSeconds);

    // Persist subtitlesCut as a separate file too, mirroring subtitles.json conventions.
    const subsCutPath = await getJobFilePath(jobId, 'subtitles-cut.json');
    await fs.writeFile(subsCutPath, JSON.stringify(subtitlesCut, null, 2));

    await saveJobMetadata(jobId, {
      status: 'analyzing',
      cutPath,
      subtitlesCut,
      silenceCutSeconds: Math.round(removedSeconds * 100) / 100,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `✓ Cut silence ${jobId} in ${elapsed}s ` +
      `(removed ${removedSeconds.toFixed(2)}s, ${keepSegments.length} segments, ` +
      `final=${finalDuration.toFixed(2)}s)`,
    );

    return NextResponse.json({
      success: true,
      cutPath,
      removedSeconds: Math.round(removedSeconds * 100) / 100,
      originalDuration,
      finalDuration: Math.round(finalDuration * 100) / 100,
      keepSegments: keepSegments.length,
    });
  } catch (error) {
    const msg = (error as Error).message ?? String(error);
    console.error('[cut-silence] FAILED:', msg);

    if (jobId) {
      await saveJobMetadata(jobId, {
        status: 'error',
        errorMessage: `Cut silence failed: ${msg.slice(0, 500)}`,
      });
    }

    return NextResponse.json(
      { error: 'Silence cut failed', details: msg },
      { status: 500 },
    );
  }
}
