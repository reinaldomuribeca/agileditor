import { spawn } from 'child_process';
import { KeepSegment } from './silence';

/**
 * Detect scene-change timestamps via ffmpeg's `select='gt(scene,T)'` filter.
 *
 * We don't process audio here — we only care about visual transitions. The output
 * lines we look for come from the `showinfo` filter, e.g.:
 *     [Parsed_showinfo_1 @ 0x...] n:  12 pts: 384 pts_time:12.800 ...
 *
 * Threshold T ranges 0..1 (Y-channel difference). Sensible band is 0.15..0.55.
 * Returns the timestamps (in seconds) where a scene change was detected — sorted.
 */
export function detectSceneChanges(
  ffmpegBin: string,
  videoPath: string,
  threshold: number,
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const args = [
      '-hide_banner',
      '-i', videoPath,
      '-vf', `select='gt(scene,${threshold.toFixed(2)})',showinfo`,
      '-an',
      '-f', 'null',
      '-',
    ];

    const proc = spawn(ffmpegBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    proc.stdout.on('data', () => {});
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('error', reject);
    proc.on('close', (code) => {
      // ffmpeg often exits 0 here even with no detections; non-zero indicates a real failure.
      if (code !== 0) {
        return reject(new Error(`ffmpeg scene-detect failed (exit ${code}): ${stderr.slice(-300)}`));
      }
      const timestamps: number[] = [];
      const re = /pts_time:([0-9]+(?:\.[0-9]+)?)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(stderr)) !== null) {
        const t = parseFloat(m[1]);
        if (Number.isFinite(t)) timestamps.push(t);
      }
      timestamps.sort((a, b) => a - b);
      resolve(timestamps);
    });
  });
}

export interface SceneCutOptions {
  /** Source duration in seconds. Required to bound the last keep-segment. */
  totalDuration: number;
  /** Seconds of footage to keep before each scene change. Default 0.5. */
  windowBefore?: number;
  /** Seconds of footage to keep after each scene change. Default 1.5. */
  windowAfter?: number;
  /** If a gap between two scene-change windows is below this, merge them. Default 0.6. */
  mergeGap?: number;
}

/**
 * Convert a list of scene-change timestamps into keep-segments — same shape as
 * the silence-cut so the rest of the pipeline (shiftSubtitles, ffmpeg cut) is shared.
 *
 * Each scene-change time T produces a window [T - windowBefore, T + windowAfter].
 * Windows that overlap (or come within `mergeGap` of each other) are merged.
 *
 * If no scene changes were found, returns a single keep-segment covering the
 * entire video — better than producing an empty cut.
 *
 * Pure: no I/O.
 */
export function buildKeepSegmentsFromSceneChanges(
  sceneChangeTimes: number[],
  options: SceneCutOptions,
): KeepSegment[] {
  const before = options.windowBefore ?? 0.5;
  const after = options.windowAfter ?? 1.5;
  const mergeGap = options.mergeGap ?? 0.6;
  const total = options.totalDuration;

  if (sceneChangeTimes.length === 0 || total <= 0) {
    // No changes detected — keep the whole video.
    return [{ start: 0, end: total, cumulativeRemoved: 0 }];
  }

  // Build raw windows, clamp to [0, total]
  const windows = sceneChangeTimes
    .map((t) => ({
      start: Math.max(0, t - before),
      end: Math.min(total, t + after),
    }))
    .filter((w) => w.end > w.start)
    .sort((a, b) => a.start - b.start);

  // Always keep the very start of the video — the first scene-change "fires" only
  // AFTER a transition occurs, so the opening shot would be lost otherwise.
  if (windows.length === 0 || windows[0].start > 0) {
    const firstChange = sceneChangeTimes[0] ?? total;
    windows.unshift({ start: 0, end: Math.min(total, firstChange + after) });
  }

  // Merge windows that overlap or are within mergeGap.
  const merged: { start: number; end: number }[] = [];
  for (const w of windows) {
    const last = merged[merged.length - 1];
    if (last && w.start - last.end < mergeGap) {
      last.end = Math.max(last.end, w.end);
    } else {
      merged.push({ ...w });
    }
  }

  // Compute cumulativeRemoved per segment.
  const out: KeepSegment[] = [];
  let cursor = 0;
  let removed = 0;
  for (const w of merged) {
    if (w.start > cursor) removed += w.start - cursor;
    out.push({ start: w.start, end: w.end, cumulativeRemoved: removed });
    cursor = w.end;
  }
  return out;
}
