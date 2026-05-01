import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeKeepSegments, shiftSubtitles, totalRemovedSeconds } from './silence';
import type { Subtitle } from './types';

const sub = (i: number, start: number, end: number, text = `s${i}`): Subtitle => ({
  index: i,
  text,
  start,
  end,
  words: [],
});

test('computeKeepSegments: no gap >= minGap merges everything into one segment', () => {
  const subs: Subtitle[] = [
    sub(0, 0, 1.0),
    sub(1, 1.2, 2.2), // gap 0.2 → below 0.8 → merge
    sub(2, 2.5, 3.5), // gap 0.3 → below 0.8 → merge
  ];
  const keep = computeKeepSegments(subs, { minGap: 0.8, paddingStart: 0.05, paddingEnd: 0.05 });
  assert.equal(keep.length, 1);
  // First range starts at max(0, 0 - 0.05) = 0; last range ends at 3.5 + 0.05 = 3.55
  assert.equal(keep[0].start, 0);
  assert.ok(Math.abs(keep[0].end - 3.55) < 1e-9);
  assert.equal(keep[0].cumulativeRemoved, 0);
});

test('computeKeepSegments: one big gap in the middle produces two keep segments', () => {
  const subs: Subtitle[] = [
    sub(0, 0, 1.0),
    sub(1, 5.0, 6.0), // gap from 1.05 → 4.95 = 3.9s → above 0.8 → cut
  ];
  const keep = computeKeepSegments(subs, { minGap: 0.8, paddingStart: 0.05, paddingEnd: 0.05 });
  assert.equal(keep.length, 2);
  assert.ok(Math.abs(keep[0].start - 0) < 1e-9);
  assert.ok(Math.abs(keep[0].end - 1.05) < 1e-9);
  assert.equal(keep[0].cumulativeRemoved, 0);
  assert.ok(Math.abs(keep[1].start - 4.95) < 1e-9);
  assert.ok(Math.abs(keep[1].end - 6.05) < 1e-9);
  // Removed before second segment = 4.95 - 1.05 = 3.9
  assert.ok(Math.abs(keep[1].cumulativeRemoved - 3.9) < 1e-9);
});

test('computeKeepSegments: multiple gaps yield multiple segments with monotonic cumulativeRemoved', () => {
  const subs: Subtitle[] = [
    sub(0, 0, 1.0),
    sub(1, 3.0, 4.0),  // gap 2.0 → cut
    sub(2, 4.5, 5.5),  // gap 0.5 → merge with prev
    sub(3, 8.0, 9.0),  // gap 2.5 → cut
  ];
  const keep = computeKeepSegments(subs, { minGap: 0.8, paddingStart: 0.05, paddingEnd: 0.05 });
  assert.equal(keep.length, 3);
  // Seg 0: [-0.05→0, 1.05]
  assert.ok(Math.abs(keep[0].end - 1.05) < 1e-9);
  assert.equal(keep[0].cumulativeRemoved, 0);
  // Seg 1: starts at 2.95, merges sub1+sub2 → ends at 5.55
  assert.ok(Math.abs(keep[1].start - 2.95) < 1e-9);
  assert.ok(Math.abs(keep[1].end - 5.55) < 1e-9);
  assert.ok(Math.abs(keep[1].cumulativeRemoved - (2.95 - 1.05)) < 1e-9); // 1.9
  // Seg 2: starts at 7.95
  assert.ok(Math.abs(keep[2].start - 7.95) < 1e-9);
  assert.ok(Math.abs(keep[2].end - 9.05) < 1e-9);
  // Removed before seg2: 1.9 (from before) + (7.95 - 5.55) = 1.9 + 2.4 = 4.3
  assert.ok(Math.abs(keep[2].cumulativeRemoved - 4.3) < 1e-9);
});

test('shiftSubtitles: subtitles in cut silence are dropped; survivors are remapped', () => {
  // Two real subtitles, separated by a silence gap. After cutting, second should start right
  // after the first ends.
  const subs: Subtitle[] = [
    {
      index: 0, text: 'hello world', start: 0, end: 1.0,
      words: [
        { word: 'hello', start: 0, end: 0.5, sentiment: 'neutral' },
        { word: 'world', start: 0.5, end: 1.0, sentiment: 'neutral' },
      ],
    },
    {
      index: 1, text: 'goodbye', start: 5.0, end: 6.0,
      words: [{ word: 'goodbye', start: 5.0, end: 6.0, sentiment: 'neutral' }],
    },
  ];
  const keep = computeKeepSegments(subs, { minGap: 0.8, paddingStart: 0.05, paddingEnd: 0.05 });
  const shifted = shiftSubtitles(subs, keep);
  assert.equal(shifted.length, 2);
  // First survives unchanged (cumulativeRemoved = 0)
  assert.equal(shifted[0].index, 0);
  assert.equal(shifted[0].start, 0);
  // Second is shifted left by 3.9
  assert.equal(shifted[1].index, 1);
  assert.ok(Math.abs(shifted[1].start - (5.0 - 3.9)) < 1e-9);
  assert.ok(Math.abs(shifted[1].end - (6.0 - 3.9)) < 1e-9);
  // Word timestamps shifted too
  assert.ok(Math.abs(shifted[1].words[0].start - 1.1) < 1e-9);
  assert.ok(Math.abs(shifted[1].words[0].end - 2.1) < 1e-9);
});

test('totalRemovedSeconds: matches gaps removed', () => {
  const subs: Subtitle[] = [sub(0, 0, 1), sub(1, 5, 6)];
  const keep = computeKeepSegments(subs, { minGap: 0.8, paddingStart: 0.05, paddingEnd: 0.05 });
  // Original = 6s; kept = (1.05 - 0) + (6.05 - 4.95) = 1.05 + 1.1 = 2.15; removed = 3.85
  const removed = totalRemovedSeconds(keep, 6);
  assert.ok(Math.abs(removed - 3.85) < 1e-9);
});

test('computeKeepSegments: empty input returns empty array', () => {
  assert.deepEqual(computeKeepSegments([]), []);
});
