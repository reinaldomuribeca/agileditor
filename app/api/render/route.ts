import { NextRequest, NextResponse } from 'next/server';
import { getJobMetadata, saveJobMetadata, getJobFilePath } from '@/lib/storage';
import { convertScenesFromLegendaIndex } from '@/lib/scenes';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let jobId: string | undefined;
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
    // Prefer the silence-cut timeline when available; fall back to raw subtitles + normalized.mp4
    // for backwards compat with jobs created before Phase 1.
    const effectiveSubs = (job.subtitlesCut && job.subtitlesCut.length > 0)
      ? job.subtitlesCut
      : job.subtitles;
    const useCut = !!(job.subtitlesCut && job.cutPath);

    if (!job.analysis?.scenes || !effectiveSubs || effectiveSubs.length === 0) {
      return NextResponse.json({ error: 'Job not ready: missing analysis or subtitles' }, { status: 400 });
    }

    // Convert scenes from subtitle index to frame numbers (against the same timeline)
    const scenesWithFrames = convertScenesFromLegendaIndex(job.analysis.scenes, effectiveSubs);

    if (scenesWithFrames.length === 0) {
      return NextResponse.json({ error: 'No scenes to render' }, { status: 400 });
    }

    // Prepare paths
    const outputPath = await getJobFilePath(jobId, 'output.mp4');
    const propsFile = await getJobFilePath(jobId, 'render-props.json');

    // Serve the video via HTTP so Remotion's Chromium can load it (file:// is blocked).
    // Remotion's headless Chromium does NOT use this Next.js server as its origin, so any
    // relative URL inside scene props would resolve against Remotion's own origin (typically
    // localhost:3000) and 404. We absolutize anything that starts with '/' here.
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333';
    const videoFile = useCut ? 'cut.mp4' : 'normalized.mp4';
    const videoSrc = `${appUrl}/api/video/${jobId}/${videoFile}`;
    console.log(`[render] using ${videoFile} (timeline=${useCut ? 'cut' : 'raw'}) appUrl=${appUrl}`);

    const scenesAbs = scenesWithFrames.map((s) => ({
      ...s,
      imageUrl: s.imageUrl?.startsWith('/') ? `${appUrl}${s.imageUrl}` : s.imageUrl,
    }));

    await fs.writeFile(propsFile, JSON.stringify({
      scenes: scenesAbs,
      subtitles: effectiveSubs,
      videoSrc,
    }));

    // Mark job as rendering immediately
    await saveJobMetadata(jobId, { status: 'rendering' });

    // Run Remotion render as background process. Prefer the root-installed binary so a fresh
    // `npm install` in the project root is enough; fall back to the remotion/ subproject for
    // backwards compat with older clones.
    const remotionDir = path.join(process.cwd(), 'remotion');
    const rootBin     = path.join(process.cwd(), 'node_modules', '.bin', 'remotion');
    const subBin      = path.join(remotionDir, 'node_modules', '.bin', 'remotion');
    let remotionBin = rootBin;
    try {
      await fs.access(rootBin);
    } catch {
      remotionBin = subBin;
    }
    console.log(`[render] using remotion bin: ${remotionBin}`);

    const child = spawn(
      remotionBin,
      [
        'render',
        'src/index.tsx',
        'AgileEditor',
        outputPath,
        `--props=${propsFile}`,
        '--codec=h264',
        '--log=error',
      ],
      {
        cwd: remotionDir,
        env: { ...process.env, NODE_ENV: 'production' },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    child.stdout?.on('data', (d) => process.stdout.write(d));
    child.stderr?.on('data', (d) => process.stderr.write(d));

    child.on('close', async (code) => {
      if (code === 0) {
        console.log(`✓ Render complete: ${jobId}`);
        await saveJobMetadata(jobId!, { status: 'done', outputPath });
      } else {
        console.error(`✗ Render failed (exit ${code}): ${jobId}`);
        await saveJobMetadata(jobId!, {
          status: 'error',
          errorMessage: `Remotion render exited with code ${code}`,
        });
      }
    });

    child.on('error', async (err) => {
      console.error('Render spawn error:', err);
      await saveJobMetadata(jobId!, {
        status: 'error',
        errorMessage: `Failed to start renderer: ${err.message}`,
      });
    });

    return NextResponse.json({ success: true, message: 'Rendering started' });
  } catch (error) {
    console.error('Render route error:', error);
    if (jobId) {
      await saveJobMetadata(jobId, {
        status: 'error',
        errorMessage: (error as Error).message,
      });
    }
    return NextResponse.json(
      { error: 'Failed to start render', details: (error as Error).message },
      { status: 500 }
    );
  }
}
