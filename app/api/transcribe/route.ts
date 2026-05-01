import { NextRequest, NextResponse } from 'next/server';
import { getJobMetadata, saveJobMetadata, getJobFilePath } from '@/lib/storage';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import { Subtitle, Word } from '@/lib/types';
import { classify } from '@/lib/sentiment';
import { analyzeTranscription } from '@/lib/whisper-hallucinations';

const OpenAI = require('openai').default;
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const FFMPEG_BIN: string = ffmpegInstaller.path;

function makeWhisperClient() {
  if (process.env.GROQ_API_KEY) {
    return {
      client: new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }),
      model: 'whisper-large-v3',
      provider: 'groq',
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model: 'whisper-1',
      provider: 'openai',
    };
  }
  throw new Error('Nenhuma chave de transcrição configurada. Defina GROQ_API_KEY ou OPENAI_API_KEY no .env.local');
}

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Extract audio as small mono MP3 — Whisper's native rate, much smaller than the source MP4.
 */
function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', videoPath,
      '-vn',                // strip video stream
      '-c:a', 'libmp3lame',
      '-b:a', '64k',        // low bitrate is fine for speech
      '-ar', '16000',       // 16 kHz — Whisper's native sample rate
      '-ac', '1',           // mono
      audioPath,
    ];

    const proc = spawn(FFMPEG_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderrTail = '';
    proc.stdout.on('data', () => {});
    proc.stderr.on('data', (chunk: Buffer) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-2000);
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg audio extract failed (exit ${code}): ${stderrTail.slice(-300)}`));
      }
    });
  });
}

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
    if (!job.normalizedPath) {
      return NextResponse.json({ error: 'Job not yet normalized' }, { status: 400 });
    }

    // Idempotency: skip if already transcribed and subtitles exist on disk
    const subtitlesPath = await getJobFilePath(jobId, 'subtitles.json');
    if (job.subtitles && job.subtitles.length > 0) {
      try {
        await fs.access(subtitlesPath);
        console.log(`[transcribe] already done for ${jobId}, skipping`);
        if (job.status === 'transcribing') {
          await saveJobMetadata(jobId, { status: 'cutting-silence' });
        }
        return NextResponse.json({ success: true, skipped: true, subtitles: job.subtitles });
      } catch {
        // subtitles.json missing — fall through and re-transcribe
      }
    }

    // Verify normalized file exists
    try {
      const stat = await fs.stat(job.normalizedPath);
      if (stat.size === 0) throw new Error('Normalized file is empty');
      console.log(`[transcribe] source: ${job.normalizedPath} (${(stat.size / 1_048_576).toFixed(1)} MB)`);
    } catch (err) {
      throw new Error(`Normalized video not accessible: ${(err as Error).message}`);
    }

    // Extract audio as small MP3
    const audioPath = await getJobFilePath(jobId, 'audio.mp3');
    console.log(`[transcribe] extracting audio → ${audioPath}`);
    await extractAudio(job.normalizedPath, audioPath);

    const audioStat = await fs.stat(audioPath);
    const audioMB = (audioStat.size / 1_048_576).toFixed(1);
    console.log(`[transcribe] audio extracted: ${audioMB} MB`);

    if (audioStat.size > 24 * 1_048_576) {
      throw new Error(`Audio too large for Whisper: ${audioMB} MB (limit: 24 MB). Video may be too long.`);
    }

    const { client, model, provider } = makeWhisperClient();

    const audioBuffer = await fs.readFile(audioPath);

    async function callWhisper(withWordTimestamps: boolean) {
      // Re-create the File on each call — some SDK versions consume the underlying stream.
      const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
      const opts: Record<string, unknown> = {
        file: audioFile,
        model,
        response_format: 'verbose_json',
      };
      if (withWordTimestamps) {
        opts.timestamp_granularities = ['word', 'segment'];
      }
      return client.audio.transcriptions.create(opts);
    }

    console.log(`[transcribe] calling Whisper via ${provider} (${model}) for ${jobId} (mode=word attempt)...`);

    let transcript: any = await callWhisper(true);
    let mode: 'word' | 'segment-only' = 'word';

    const haveSegments = transcript.segments && transcript.segments.length > 0;
    const haveWords = transcript.words && transcript.words.length > 0;
    if (!haveSegments || !haveWords) {
      console.log(
        `[transcribe] mode=word returned segments=${transcript.segments?.length ?? 0} words=${transcript.words?.length ?? 0}; falling back to segment-only`,
      );
      transcript = await callWhisper(false);
      mode = 'segment-only';
    }

    console.log(
      `[transcribe] mode=${mode} segments=${transcript.segments?.length ?? 0} words=${transcript.words?.length ?? 0}`,
    );

    const subtitles: Subtitle[] = [];
    let subtitleIndex = 0;

    type WhisperWord = { word: string; start: number; end: number };

    if (transcript.segments && transcript.segments.length > 0) {
      const allWords: WhisperWord[] = (transcript.words as WhisperWord[] | undefined) ?? [];
      for (const seg of transcript.segments) {
        const text = (seg.text as string).trim();
        if (!text) continue;
        const segWords: Word[] = [];
        if (allWords.length > 0) {
          // Whisper's words are absolute (since-start). Bucket each into the segment whose
          // [start, end] envelope contains it. Use a small epsilon for float drift.
          const eps = 0.01;
          for (const w of allWords) {
            if (w.start >= seg.start - eps && w.end <= seg.end + eps) {
              segWords.push({
                word: w.word.trim(),
                start: w.start,
                end: w.end,
                sentiment: classify(w.word),
              });
            }
          }
        }
        subtitles.push({
          index: subtitleIndex++,
          text,
          start: seg.start,
          end: seg.end,
          words: segWords,
        });
      }
    } else if (transcript.text && transcript.text.trim().length > 0) {
      // Last resort: no segments, only full text — create a single subtitle
      console.log('[transcribe] no segments, using full text as single subtitle');
      subtitles.push({
        index: 0,
        text: transcript.text.trim(),
        start: 0,
        end: transcript.duration ?? 0,
        words: [],
      });
    } else {
      throw new Error(
        'Whisper não detectou fala no vídeo. Verifique se o vídeo tem áudio com voz.'
      );
    }

    const totalWords = subtitles.reduce((acc, s) => acc + s.words.length, 0);
    console.log(`[transcribe] populated ${totalWords} word-level timestamps across ${subtitles.length} subtitles`);

    // Hallucination guard. Whisper happily produces "Legendas por TIAGO ANDERSON",
    // "thanks for watching", music markers, etc. when fed silence/music/unintelligible
    // audio. We detect these patterns and either drop the bad subtitles or flag.
    const halluCheck = analyzeTranscription(subtitles, job.duration);
    let finalSubtitles = subtitles;
    const warnings: string[] = [...(job.warnings ?? [])];

    if (halluCheck.isLikelyHallucination) {
      console.warn(
        `[transcribe] HALLUCINATION detected — ratio=${halluCheck.ratio.toFixed(2)} ` +
        `speech=${halluCheck.totalSpeechSeconds.toFixed(2)}s of ${(job.duration ?? 0).toFixed(2)}s ` +
        `samples=${halluCheck.matches.join(' | ')}`,
      );

      // Replace fake subtitles with a single placeholder spanning the whole video so
      // the cut step can still proceed but won't trim 90%+ of the video.
      finalSubtitles = [{
        index: 0,
        text: '',
        start: 0,
        end: job.duration ?? (subtitles[subtitles.length - 1]?.end ?? 0),
        words: [],
      }];
      warnings.push(
        `Whisper retornou apenas alucinações conhecidas (${halluCheck.matches[0] ?? '—'}). ` +
        `Considere usar "Sem corte" ou "Corte por cena" para este vídeo.`,
      );
    }

    await fs.writeFile(subtitlesPath, JSON.stringify(finalSubtitles, null, 2));

    await saveJobMetadata(jobId, {
      status: 'cutting-silence',
      subtitles: finalSubtitles,
      warnings,
    });

    console.log(`✓ Transcribed ${jobId}: ${finalSubtitles.length} subtitles`);

    return NextResponse.json({ success: true, subtitles: finalSubtitles, hallucinationDetected: halluCheck.isLikelyHallucination });

  } catch (error) {
    const msg = (error as Error).message ?? String(error);
    console.error('[transcribe] FAILED:', msg);

    if (jobId) {
      await saveJobMetadata(jobId, {
        status: 'error',
        errorMessage: `Transcribe failed: ${msg.slice(0, 500)}`,
      });
    }

    return NextResponse.json(
      { error: 'Transcription failed', details: msg },
      { status: 500 },
    );
  }
}
