import { NextRequest, NextResponse } from 'next/server';
import { getJobMetadata, saveJobMetadata, getJobFilePath } from '@/lib/storage';
import { computeKeepSegments, shiftSubtitles, totalRemovedSeconds, KeepSegment } from '@/lib/silence';
import { detectSceneChanges, buildKeepSegmentsFromSceneChanges } from '@/lib/scene-cut';
import { aiCutKeepSegments } from '@/lib/ai-cut';
import { CutAggressiveness, CutMode, Subtitle } from '@/lib/types';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const FFMPEG_BIN: string = ffmpegInstaller.path;

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * Aggressiveness mapping. The "balanced" row is what the legacy single-mode
 * cut-silence used (minGap=0.8s, padding=0.05s).
 */
const SPEECH_TUNINGS: Record<CutAggressiveness, { minGap: number; padding: number }> = {
  subtle:     { minGap: 1.5, padding: 0.10 },
  balanced:   { minGap: 0.8, padding: 0.05 },
  aggressive: { minGap: 0.4, padding: 0.02 },
};

const SCENE_TUNINGS: Record<CutAggressiveness, { threshold: number; windowBefore: number; windowAfter: number; mergeGap: number }> = {
  subtle:     { threshold: 0.55, windowBefore: 0.6, windowAfter: 2.0, mergeGap: 1.0 },
  balanced:   { threshold: 0.40, windowBefore: 0.5, windowAfter: 1.5, mergeGap: 0.6 },
  aggressive: { threshold: 0.20, windowBefore: 0.3, windowAfter: 1.0, mergeGap: 0.4 },
};

function buildFilterComplex(segments: { start: number; end: number }[]): string {
  const parts: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const { start, end } = segments[i];
    parts.push(`[0:v]trim=start=${start.toFixed(3)}:end=${end.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`);
    parts.push(`[0:a]atrim=start=${start.toFixed(3)}:end=${end.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`);
  }
  const inputs = segments.map((_, i) => `[v${i}][a${i}]`).join('');
  parts.push(`${inputs}concat=n=${segments.length}:v=1:a=1[outv][outa]`);
  return parts.join(';');
}

function runFfmpegCut(inputPath: string, outputPath: string, segments: { start: number; end: number }[]): Promise<void> {
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

    console.log(`[cut] spawn ffmpeg, ${segments.length} keep-segments, filter length=${filter.length}`);
    const proc = spawn(FFMPEG_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderrTail = '';
    proc.stdout.on('data', () => {});
    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrTail = (stderrTail + text).slice(-2000);
      const m = text.match(/frame=\s*(\d+).*?time=(\S+)/);
      if (m) console.log(`[cut] frame=${m[1]} time=${m[2]}`);
    });

    proc.on('error', reject);
    proc.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const reason = signal ? `signal ${signal}` : `exit code ${code}`;
        reject(new Error(`ffmpeg failed (${reason}): ${stderrTail.slice(-300)}`));
      }
    });
  });
}

/**
 * Compute keep-segments based on the selected cut mode. Pure dispatcher — does no I/O
 * for `none`, calls ffmpeg for `scene`, calls Claude for `ai`, runs subtitle math for `speech`.
 */
async function computeKeepForMode(args: {
  mode: CutMode;
  aggressiveness: CutAggressiveness;
  subtitles: Subtitle[];
  videoPath: string;
  totalDuration: number;
  prompt?: string;
}): Promise<{ segments: KeepSegment[]; modeUsed: CutMode; notes: string[] }> {
  const { mode, aggressiveness, subtitles, videoPath, totalDuration, prompt } = args;
  const notes: string[] = [];

  if (mode === 'none') {
    return {
      segments: [{ start: 0, end: totalDuration, cumulativeRemoved: 0 }],
      modeUsed: 'none',
      notes: ['Modo "sem corte" — vídeo mantido por inteiro'],
    };
  }

  if (mode === 'speech') {
    const tune = SPEECH_TUNINGS[aggressiveness];
    notes.push(`Corte por fala (${aggressiveness}): minGap=${tune.minGap}s padding=${tune.padding}s`);
    return {
      segments: computeKeepSegments(subtitles, {
        paddingStart: tune.padding,
        paddingEnd: tune.padding,
        minGap: tune.minGap,
        totalDuration,
      }),
      modeUsed: 'speech',
      notes,
    };
  }

  if (mode === 'scene') {
    const tune = SCENE_TUNINGS[aggressiveness];
    notes.push(`Corte por cena (${aggressiveness}): threshold=${tune.threshold}`);
    const changes = await detectSceneChanges(FFMPEG_BIN, videoPath, tune.threshold);
    notes.push(`Detected ${changes.length} mudanças de cena`);
    return {
      segments: buildKeepSegmentsFromSceneChanges(changes, {
        totalDuration,
        windowBefore: tune.windowBefore,
        windowAfter: tune.windowAfter,
        mergeGap: tune.mergeGap,
      }),
      modeUsed: 'scene',
      notes,
    };
  }

  if (mode === 'ai') {
    notes.push('Corte inteligente (Claude analisa o transcript)');
    const result = await aiCutKeepSegments(subtitles, { totalDuration, prompt });
    if (result.reasons.length > 0) notes.push(...result.reasons);
    return { segments: result.segments, modeUsed: 'ai', notes };
  }

  // Defensive: unknown mode → no cut
  notes.push(`Modo desconhecido "${mode}" — caindo em "sem corte"`);
  return {
    segments: [{ start: 0, end: totalDuration, cumulativeRemoved: 0 }],
    modeUsed: 'none',
    notes,
  };
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

    const cutPath = await getJobFilePath(jobId, 'cut.mp4');

    // Idempotency
    if (job.cutPath && job.subtitlesCut && job.subtitlesCut.length > 0) {
      try {
        await fs.access(cutPath);
        console.log(`[cut] already done for ${jobId}, skipping`);
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

    const cutMode: CutMode = job.cutMode ?? 'speech';
    const aggressiveness: CutAggressiveness = job.cutAggressiveness ?? 'balanced';
    const totalDuration = job.duration ?? job.subtitles[job.subtitles.length - 1].end;

    console.log(`[cut] mode=${cutMode} aggr=${aggressiveness} duration=${totalDuration}s subs=${job.subtitles.length}`);

    const { segments: keepSegments, modeUsed, notes } = await computeKeepForMode({
      mode: cutMode,
      aggressiveness,
      subtitles: job.subtitles,
      videoPath: job.normalizedPath,
      totalDuration,
      prompt: job.prompt,
    });

    if (keepSegments.length === 0) {
      throw new Error('No keep-segments computed.');
    }

    // SANITY CHECK: never let the cut destroy the video. If the resulting cut would
    // be < 30% of the source, fall back to keeping the original. This protects
    // against Whisper hallucinations, scene-detection misfires, or AI overcuts.
    const kept = keepSegments.reduce((acc, s) => acc + (s.end - s.start), 0);
    const ratio = totalDuration > 0 ? kept / totalDuration : 1;
    let usedFallback = false;
    let effectiveSegments = keepSegments;
    if (ratio < 0.3) {
      console.warn(`[cut] kept=${kept.toFixed(2)}s of ${totalDuration.toFixed(2)}s (${(ratio * 100).toFixed(0)}%) — falling back to no-cut`);
      effectiveSegments = [{ start: 0, end: totalDuration, cumulativeRemoved: 0 }];
      notes.push(`Fallback: corte teria removido ${((1 - ratio) * 100).toFixed(0)}% do vídeo — desligado por segurança`);
      usedFallback = true;
    }

    const removedSeconds = totalRemovedSeconds(effectiveSegments, totalDuration);
    console.log(`[cut] keep_segments=${effectiveSegments.length} removed=${removedSeconds.toFixed(2)}s`);

    if (removedSeconds < 0.1) {
      console.log('[cut] removedSeconds < 0.1, copying normalized.mp4 → cut.mp4');
      await fs.copyFile(job.normalizedPath, cutPath);
    } else {
      await runFfmpegCut(
        job.normalizedPath,
        cutPath,
        effectiveSegments.map((s) => ({ start: s.start, end: s.end })),
      );
    }

    const stat = await fs.stat(cutPath);
    if (stat.size === 0) throw new Error('cut.mp4 output file is empty');

    const subtitlesCut = shiftSubtitles(job.subtitles, effectiveSegments);

    const subsCutPath = await getJobFilePath(jobId, 'subtitles-cut.json');
    await fs.writeFile(subsCutPath, JSON.stringify(subtitlesCut, null, 2));

    const warnings = [...(job.warnings ?? []), ...notes];
    if (usedFallback) warnings.push('cut-fallback-applied');

    await saveJobMetadata(jobId, {
      status: 'analyzing',
      cutPath,
      subtitlesCut,
      silenceCutSeconds: Math.round(removedSeconds * 100) / 100,
      warnings,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✓ Cut(${modeUsed}) ${jobId} in ${elapsed}s (removed ${removedSeconds.toFixed(2)}s, ${effectiveSegments.length} segs, fallback=${usedFallback})`);

    return NextResponse.json({
      success: true,
      mode: modeUsed,
      cutPath,
      removedSeconds: Math.round(removedSeconds * 100) / 100,
      originalDuration: totalDuration,
      keepSegments: effectiveSegments.length,
      usedFallback,
      notes,
    });
  } catch (error) {
    const msg = (error as Error).message ?? String(error);
    console.error('[cut] FAILED:', msg);

    if (jobId) {
      await saveJobMetadata(jobId, {
        status: 'error',
        errorMessage: `Cut failed: ${msg.slice(0, 500)}`,
      });
    }

    return NextResponse.json({ error: 'Video cut failed', details: msg }, { status: 500 });
  }
}
