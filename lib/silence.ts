import { Subtitle, Word } from './types';

export interface KeepSegment {
  /** Start time in the ORIGINAL video, seconds. */
  start: number;
  /** End time in the ORIGINAL video, seconds. */
  end: number;
  /** Cumulative seconds removed BEFORE this segment (i.e. the offset to subtract from
   *  any original timestamp falling inside this segment to map it to the cut timeline). */
  cumulativeRemoved: number;
}

export interface ComputeKeepOptions {
  /** Padding (seconds) added before each subtitle's start. Default 0.05. */
  paddingStart?: number;
  /** Padding (seconds) added after each subtitle's end. Default 0.05. */
  paddingEnd?: number;
  /** Minimum gap (seconds) between consecutive (padded) subtitle ranges that triggers a cut.
   *  Gaps smaller than this are MERGED — i.e. kept as part of the surrounding segment. */
  minGap?: number;
  /** Total source duration in seconds. If provided, the last keep-segment is extended to it
   *  only when the trailing tail is shorter than `minGap` (otherwise that tail is treated
   *  as final silence and dropped). */
  totalDuration?: number;
}

/**
 * Compute the list of "keep" segments from a list of subtitles.
 *
 * Rule: take each subtitle's [start - paddingStart, end + paddingEnd] range; merge any two
 * adjacent ranges whose gap (next.start - prev.end) is < minGap. What's left between
 * non-merged ranges is silence to be cut.
 *
 * Pure: no I/O, no time, no randomness.
 */
export function computeKeepSegments(
  subtitles: Subtitle[],
  options: ComputeKeepOptions = {},
): KeepSegment[] {
  const padStart = options.paddingStart ?? 0.05;
  const padEnd = options.paddingEnd ?? 0.05;
  const minGap = options.minGap ?? 0.8;

  if (subtitles.length === 0) return [];

  // Build padded ranges; clamp to [0, +inf).
  const ranges = subtitles
    .map((s) => ({
      start: Math.max(0, s.start - padStart),
      end: s.end + padEnd,
    }))
    // Defensive: ensure non-decreasing order by start.
    .sort((a, b) => a.start - b.start);

  // Merge ranges whose gap is below the threshold.
  const merged: { start: number; end: number }[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push({ ...r });
      continue;
    }
    const gap = r.start - last.end;
    if (gap < minGap) {
      // Merge: extend the previous range. (gap may be negative for overlapping ranges.)
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }

  // Compute cumulativeRemoved per segment.
  const out: KeepSegment[] = [];
  let cursor = 0; // position in original timeline up to which we've accounted for
  let removed = 0;
  for (const m of merged) {
    // Anything between `cursor` and `m.start` is silence being removed.
    if (m.start > cursor) {
      removed += m.start - cursor;
    }
    out.push({ start: m.start, end: m.end, cumulativeRemoved: removed });
    cursor = m.end;
  }

  // If a totalDuration was provided and the last segment's end is very close to it, extend it
  // — avoids leaving a sliver of original audio off the end. Otherwise, anything after the
  // last segment is treated as trailing silence and simply not kept.
  if (options.totalDuration !== undefined && out.length > 0) {
    const last = out[out.length - 1];
    const trailing = options.totalDuration - last.end;
    if (trailing > 0 && trailing < minGap) {
      last.end = options.totalDuration;
    }
  }

  return out;
}

/**
 * Re-time subtitles for the cut timeline. For each subtitle, find which keep segment it falls
 * into (by its start time on the original timeline) and subtract that segment's cumulativeRemoved.
 *
 * Subtitles whose start does not fall inside any keep segment are dropped (they would have
 * been silence-cut). Words inside a kept subtitle are shifted by the same offset.
 *
 * Pure: no I/O.
 */
export function shiftSubtitles(
  subtitles: Subtitle[],
  keepSegments: KeepSegment[],
): Subtitle[] {
  if (keepSegments.length === 0) return [];

  const shifted: Subtitle[] = [];
  let nextIndex = 0;

  for (const sub of subtitles) {
    const seg = findContainingSegment(sub.start, keepSegments);
    if (!seg) continue; // dropped (this subtitle was inside cut silence)

    const offset = seg.cumulativeRemoved;
    const newStart = sub.start - offset;
    // Clamp end so it doesn't exceed the kept segment boundary on the cut timeline.
    const segCutEnd = seg.end - offset;
    const newEnd = Math.min(sub.end - offset, segCutEnd);

    const newWords: Word[] = (sub.words ?? [])
      .filter((w) => w.start >= seg.start && w.end <= seg.end + 1e-6)
      .map((w) => ({
        ...w,
        start: w.start - offset,
        end: w.end - offset,
      }));

    shifted.push({
      ...sub,
      index: nextIndex++,
      start: newStart,
      end: newEnd,
      words: newWords,
    });
  }

  return shifted;
}

function findContainingSegment(t: number, segs: KeepSegment[]): KeepSegment | null {
  // Linear is fine — N is in the dozens. Use a small epsilon to be inclusive on boundaries.
  const eps = 1e-6;
  for (const s of segs) {
    if (t >= s.start - eps && t <= s.end + eps) return s;
  }
  return null;
}

/** Total seconds removed by a list of keep segments, given the original duration. */
export function totalRemovedSeconds(
  keepSegments: KeepSegment[],
  originalDuration: number,
): number {
  if (keepSegments.length === 0) return originalDuration;
  let kept = 0;
  for (const s of keepSegments) kept += s.end - s.start;
  return Math.max(0, originalDuration - kept);
}
