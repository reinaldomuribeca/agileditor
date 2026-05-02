import { NextRequest, NextResponse } from 'next/server';
import { getJobMetadata, saveJobMetadata, getJobFilePath } from '@/lib/storage';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import fs from 'fs/promises';
import path from 'path';

const OpenAI = require('openai').default;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Generate an illustration for a single scene via OpenAI Images (gpt-image-1).
 *
 * Input:  { jobId, sceneId, imagePrompt? }
 *   - imagePrompt is optional; if omitted we use scene.imagePrompt from metadata.
 *
 * Output: { success, imageUrl } where imageUrl is a /api/video/{jobId}/images/{sceneId}.png path.
 */
export async function POST(request: NextRequest) {
  let jobId: string | undefined;

  try {
    // Rate limit: 10 image generations per minute per IP.
    // Each call costs ~$0.04, so this caps incidental damage.
    const ip = clientIp(request);
    const rl = rateLimit(`gen-image:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many image generations. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      );
    }

    const body = await request.json();
    jobId = body.jobId;
    const sceneId: string | undefined = body.sceneId;
    const overridePrompt: string | undefined = body.imagePrompt;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }
    if (!sceneId) {
      return NextResponse.json({ error: 'Missing sceneId' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
    }

    const job = await getJobMetadata(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const scenes = job.analysis?.scenes;
    if (!scenes || scenes.length === 0) {
      return NextResponse.json({ error: 'Job has no scenes' }, { status: 400 });
    }

    const sceneIdx = scenes.findIndex((s) => s.id === sceneId);
    if (sceneIdx < 0) {
      return NextResponse.json({ error: `Scene '${sceneId}' not found` }, { status: 404 });
    }
    const scene = scenes[sceneIdx];

    const rawPrompt = (overridePrompt && overridePrompt.trim()) || scene.imagePrompt || '';
    if (!rawPrompt) {
      return NextResponse.json(
        { error: `Scene '${sceneId}' has no imagePrompt` },
        { status: 400 },
      );
    }

    // Apply the user's chosen illustration style (questionnaire question 5).
    // We prepend a style modifier so every scene shares a consistent visual look,
    // even if Claude varied the imagePrompt phrasing.
    const STYLE_HINTS: Record<string, string> = {
      minimal:     'Minimalist clean flat illustration, lots of whitespace, simple geometric shapes, modern editorial look. ',
      cartoon:     '2D cartoon illustration, playful character art, bold outlines, vibrant flat colors. ',
      arrows:      'Hand-drawn vlog/tutorial annotation style, sketchy arrows, circles, underlines, marker-pen aesthetic over a solid background. ',
      infographic: 'Infographic style with charts, large numbers, icons, data-viz aesthetic, clean editorial layout. ',
      comic:       'Comic-book panel illustration, halftone dots, bold ink lines, action burst/onomatopoeia, retro HQ feel. ',
    };
    const illuStyle = job.questionnaire?.illustrations.style;
    const styleHint = illuStyle ? STYLE_HINTS[illuStyle] ?? '' : '';

    // Hard-enforce pt-BR for any text rendered inside the image.
    const ptBRSuffix = ' All visible text, letters, captions, titles, and typography in the image MUST be written in Brazilian Portuguese (pt-BR). Do not include any English words, slogans, or watermarks. If text is shown, it must be in correct, idiomatic Portuguese as spoken in Brazil.';
    const alreadyHasPtBR = /portuguese|pt[\s\-]?br|brazil/i.test(rawPrompt);
    const prompt = styleHint + (alreadyHasPtBR ? rawPrompt : rawPrompt + ptBRSuffix);

    // Ensure images dir exists
    const imagesDir = path.dirname(await getJobFilePath(jobId, `images/${sceneId}.png`));
    await fs.mkdir(imagesDir, { recursive: true });

    const imagePath = await getJobFilePath(jobId, `images/${sceneId}.png`);
    const relativeUrl = `/api/video/${jobId}/images/${sceneId}.png`;

    console.log(`[generate-image] ${jobId}/${sceneId} prompt="${prompt.slice(0, 80)}..."`);
    const t0 = Date.now();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      quality: 'medium',
      n: 1,
    });

    const datum = response?.data?.[0];
    if (!datum) {
      throw new Error('OpenAI Images returned no data');
    }

    let buffer: Buffer;
    if (datum.b64_json) {
      buffer = Buffer.from(datum.b64_json, 'base64');
    } else if (datum.url) {
      // Older response shape (dall-e fallback). Download the URL.
      const resp = await fetch(datum.url);
      if (!resp.ok) throw new Error(`Image URL fetch failed: ${resp.status}`);
      buffer = Buffer.from(await resp.arrayBuffer());
    } else {
      throw new Error('OpenAI Images response has neither b64_json nor url');
    }

    if (buffer.byteLength === 0) {
      throw new Error('Generated image is empty');
    }
    await fs.writeFile(imagePath, buffer);

    // Update analysis.scenes[sceneIdx].imageUrl in metadata + track image count
    const updatedScenes = scenes.slice();
    updatedScenes[sceneIdx] = { ...scene, imageUrl: relativeUrl };
    const prevImageCount = job.tokenUsage?.imageGenCount ?? 0;
    await saveJobMetadata(jobId, {
      analysis: {
        ...job.analysis!,
        scenes: updatedScenes,
      },
      tokenUsage: {
        ...(job.tokenUsage ?? {}),
        imageGenCount: prevImageCount + 1,
      },
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[generate-image] ✓ ${jobId}/${sceneId} → ${imagePath} (${(buffer.byteLength / 1024).toFixed(0)} KB, ${elapsed}s)`);

    return NextResponse.json({
      success: true,
      sceneId,
      imageUrl: relativeUrl,
      sizeBytes: buffer.byteLength,
      elapsedSeconds: Number(elapsed),
    });
  } catch (error) {
    const msg = (error as Error).message ?? String(error);
    console.error('[generate-image] FAILED:', msg);
    return NextResponse.json(
      { error: 'Image generation failed', details: msg },
      { status: 500 },
    );
  }
}
