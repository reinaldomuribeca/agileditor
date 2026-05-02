import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ensureJobDir, saveJobMetadata } from '@/lib/storage';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { USER_COOKIE_NAME, verifyUserCookie } from '@/lib/auth';
import type {
  CutMode,
  CutAggressiveness,
  Questionnaire,
  ContentType,
  EditingPace,
  MusicStyle,
  MusicVolume,
  SubtitleStyle,
  IllustrationStyle,
  TransitionStyle,
} from '@/lib/types';

const ALLOWED_MODES = new Set<CutMode>(['none', 'speech', 'scene', 'ai']);
const ALLOWED_AGGR = new Set<CutAggressiveness>(['subtle', 'balanced', 'aggressive']);

const ALLOWED_CONTENT: ContentType[] = ['humor', 'serious', 'emotional', 'educational', 'documentary', 'vlog', 'commercial', 'other'];
const ALLOWED_PACE: EditingPace[] = ['fast', 'medium', 'slow', 'auto'];
const ALLOWED_MUSIC_STYLE: MusicStyle[] = ['energetic', 'calm', 'epic', 'comic', 'melancholic', 'electronic', 'other'];
const ALLOWED_MUSIC_VOLUME: MusicVolume[] = ['low', 'medium', 'high'];
const ALLOWED_SUBTITLES: SubtitleStyle[] = ['standard', 'animated', 'none'];
const ALLOWED_ILLU_STYLE: IllustrationStyle[] = ['minimal', 'cartoon', 'arrows', 'infographic', 'comic'];
const ALLOWED_TRANSITION: TransitionStyle[] = ['none', 'fade-soft', 'fade-fast', 'zoom', 'slide', 'auto'];

function pickEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === 'string' && (allowed as string[]).includes(value) ? (value as T) : fallback;
}

function clampStr(s: unknown, max: number): string | undefined {
  if (typeof s !== 'string') return undefined;
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function parseQuestionnaire(raw: string | null): Questionnaire {
  let q: Record<string, unknown> = {};
  if (raw) {
    try { q = JSON.parse(raw) as Record<string, unknown>; } catch { /* fall through */ }
  }
  const m = (q.music as Record<string, unknown> | undefined) ?? {};
  const il = (q.illustrations as Record<string, unknown> | undefined) ?? {};
  const it = (q.introTitle as Record<string, unknown> | undefined) ?? {};

  return {
    contentType: pickEnum(q.contentType, ALLOWED_CONTENT, 'other'),
    contentTypeOther: clampStr(q.contentTypeOther, 60),
    pace: pickEnum(q.pace, ALLOWED_PACE, 'auto'),
    music: {
      enabled: m.enabled === true,
      style: m.enabled === true ? pickEnum(m.style, ALLOWED_MUSIC_STYLE, 'energetic') : undefined,
      styleOther: m.enabled === true ? clampStr(m.styleOther, 60) : undefined,
      volume: m.enabled === true ? pickEnum(m.volume, ALLOWED_MUSIC_VOLUME, 'medium') : undefined,
    },
    subtitles: pickEnum(q.subtitles, ALLOWED_SUBTITLES, 'standard'),
    illustrations: {
      enabled: il.enabled !== false,
      style: il.enabled !== false ? pickEnum(il.style, ALLOWED_ILLU_STYLE, 'minimal') : undefined,
    },
    introTitle: {
      enabled: it.enabled === true,
      title: it.enabled === true ? clampStr(it.title, 80) : undefined,
      subtitle: it.enabled === true ? clampStr(it.subtitle, 120) : undefined,
    },
    transition: pickEnum(q.transition, ALLOWED_TRANSITION, 'auto'),
    notes: clampStr(q.notes, 1500),
  };
}

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

    const questionnaire = parseQuestionnaire(formData.get('questionnaire') as string | null);

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
      const warnings: string[] = [];
      if (questionnaire.music.enabled) {
        warnings.push('Trilha sonora solicitada — recurso ainda em desenvolvimento, será aplicado em release futura');
      }

      // Associate job with the logged-in user (when user accounts are active)
      const userSecret = process.env.USER_SESSION_SECRET;
      let userId: string | undefined;
      if (userSecret) {
        const userCookie = request.cookies.get(USER_COOKIE_NAME)?.value;
        userId = userCookie ? (await verifyUserCookie(userCookie, userSecret).catch(() => null)) ?? undefined : undefined;
      }

      const metadata = {
        id: jobId,
        status: 'normalizing' as const,
        prompt: prompt || questionnaire.notes || undefined,
        videoPath,
        legendar,
        animator,
        cutMode,
        cutAggressiveness,
        questionnaire,
        warnings: warnings.length > 0 ? warnings : undefined,
        userId,
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
