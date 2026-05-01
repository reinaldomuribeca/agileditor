/**
 * In-memory sliding-window rate limiter.
 *
 * Single-process. Fine for one VPS / one Next.js instance. If you ever scale
 * horizontally, swap this for Upstash or Redis — same API.
 *
 * Each `key` (e.g. `upload:1.2.3.4`) keeps the timestamps of recent hits within
 * `windowMs`. When the count is at the limit, ok=false and retryAfterMs tells
 * the caller when the oldest hit will fall out of the window.
 */

import type { NextRequest } from 'next/server';

interface Entry {
  hits: number[];
}

const buckets = new Map<string, Entry>();

// Garbage collect stale buckets occasionally to bound memory.
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweepIfNeeded(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    const fresh = entry.hits.filter((t) => now - t < windowMs);
    if (fresh.length === 0) buckets.delete(key);
    else entry.hits = fresh;
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check and record a hit. Returns `{ ok: false, retryAfterMs }` when over the limit.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweepIfNeeded(now, windowMs);

  const entry = buckets.get(key) ?? { hits: [] };
  entry.hits = entry.hits.filter((t) => now - t < windowMs);

  if (entry.hits.length >= limit) {
    const oldest = entry.hits[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, windowMs - (now - oldest)),
    };
  }

  entry.hits.push(now);
  buckets.set(key, entry);
  return { ok: true, remaining: limit - entry.hits.length, retryAfterMs: 0 };
}

/**
 * Best-effort IP extraction. In production you sit behind a reverse proxy
 * (Caddy/nginx) which sets x-forwarded-for. Falls back to a constant when
 * unknown so anonymous attackers can't bypass by stripping headers.
 */
export function clientIp(req: NextRequest | Request): string {
  const h = (req as Request).headers;
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = h.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
