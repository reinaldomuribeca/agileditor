import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { JOBS_ROOT } from '@/lib/storage';

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const pkg = require('../../../package.json');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const result: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: pkg.version,
  };

  // Check ffmpeg binary
  try {
    const stat = await fs.stat(ffmpegInstaller.path);
    result.ffmpeg = {
      path: ffmpegInstaller.path,
      version: ffmpegInstaller.version,
      sizeMB: (stat.size / 1_048_576).toFixed(1),
      executable: true,
    };
  } catch (err) {
    result.ffmpeg = { error: (err as Error).message, executable: false };
    result.status = 'degraded';
  }

  // Test ffmpeg actually runs
  try {
    const versionOutput = await new Promise<string>((resolve, reject) => {
      const proc = spawn(ffmpegInstaller.path, ['-version'], { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      proc.stdout.on('data', (c: Buffer) => { stdout += c.toString(); });
      proc.stderr.on('data', () => {});
      proc.on('close', (code) => code === 0 ? resolve(stdout.split('\n')[0]) : reject(new Error(`exit ${code}`)));
      proc.on('error', reject);
      setTimeout(() => { proc.kill(); reject(new Error('ffmpeg -version timeout')); }, 3000);
    });
    (result.ffmpeg as Record<string, unknown>).runs = versionOutput;
  } catch (err) {
    (result.ffmpeg as Record<string, unknown>).runs = false;
    (result.ffmpeg as Record<string, unknown>).runError = (err as Error).message;
    result.status = 'degraded';
  }

  // Check API keys — at least one Whisper key + Anthropic must be present
  const hasWhisperKey = !!(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY);
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  result.apiKeys = {
    openai: !!process.env.OPENAI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    anthropic: hasAnthropic,
  };
  if (!hasWhisperKey || !hasAnthropic) {
    result.status = 'degraded';
  }

  // Check jobs dir + per-job images dir writability via a probe
  const jobsDir = JOBS_ROOT;
  try {
    await fs.mkdir(jobsDir, { recursive: true });
    const probeDir = path.join(jobsDir, '.health-probe', 'images');
    await fs.mkdir(probeDir, { recursive: true });
    const probeFile = path.join(probeDir, 'probe.txt');
    await fs.writeFile(probeFile, 'ok');
    await fs.unlink(probeFile);
    await fs.rmdir(probeDir);
    await fs.rmdir(path.dirname(probeDir)).catch(() => {});

    const entries = await fs.readdir(jobsDir);
    result.storage = {
      dir: jobsDir,
      jobsCount: entries.filter((e) => !e.startsWith('.')).length,
      writable: true,
      imagesSubdirWritable: true,
    };
  } catch (err) {
    result.storage = { dir: jobsDir, error: (err as Error).message };
    result.status = 'degraded';
  }

  // Status code follows status: 503 when degraded so uptime monitors flag it.
  const httpStatus = result.status === 'ok' ? 200 : 503;
  return NextResponse.json(result, { status: httpStatus });
}
