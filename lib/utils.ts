import type { NextRequest } from 'next/server';

/**
 * Build an absolute URL for redirects in API route handlers.
 *
 * Next.js route handlers receive req.url = http://0.0.0.0:PORT/... when the
 * app is bound to all interfaces (Docker). Behind Caddy, the real origin is in
 * X-Forwarded-Proto + X-Forwarded-Host. We prefer NEXT_PUBLIC_APP_URL (set in
 * Coolify) → forwarded headers → req.url as a last resort.
 */
export function redirectUrl(path: string, req: NextRequest): URL {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return new URL(path, appUrl);

  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (host) return new URL(path, `${proto}://${host}`);

  return new URL(path, req.url);
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function secondsToFrames(seconds: number, fps: number = 30): number {
  return Math.round(seconds * fps);
}

export function framesToSeconds(frames: number, fps: number = 30): number {
  return frames / fps;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
