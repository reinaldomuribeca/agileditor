# Setup

## 1. Install

```bash
npm install
```

A single install at the project root pulls in **everything**, including
`@remotion/cli`, `@remotion/bundler`, and `@remotion/renderer`. There is no
need to `cd remotion && npm install` separately anymore.

## 2. Configure

```bash
cp .env.local.example .env.local
```

Required:
- `ANTHROPIC_API_KEY` — Claude (scene analysis)
- `OPENAI_API_KEY` — Whisper fallback **and** image generation

Optional:
- `GROQ_API_KEY` — free Whisper via Groq; if set, takes precedence over OpenAI
- `JOBS_DIR` — defaults to `/tmp/agil-editor-jobs`
- `NEXT_PUBLIC_APP_URL` — defaults to `http://localhost:3333` (used by Remotion to fetch the source video over HTTP)
- `MAX_VIDEO_SIZE_MB` — informational only; the upload route does not enforce a size cap

## 3. Run

```bash
npm run dev          # → http://localhost:3333
```

To preview Remotion compositions in Studio:
```bash
npm run remotion     # → opens Remotion Studio in another port
```

## 4. Test

```bash
npm test    # unit tests for lib/silence.ts (Phase 1 math)
```

## Health check

```bash
curl http://localhost:3333/api/health | python3 -m json.tool
```

Expected fields:
- `version` — from package.json
- `ffmpeg.executable: true`, `ffmpeg.runs: "ffmpeg version ..."`
- `apiKeys.openai: true`, `apiKeys.anthropic: true`
- `storage.writable: true`, `storage.imagesSubdirWritable: true`

If any of those are false, the dependent step will fail later.

## Smoke test the pipeline

```bash
# Upload a real speech clip
curl -X POST http://localhost:3333/api/upload \
  -F "file=@your-speech.mp4" \
  -F "prompt=cooking tutorial"
# → { "jobId": "abc..." }

# Then open in browser:
open http://localhost:3333/editor/abc...
```

The client-side polling drives normalize → transcribe → cut-silence → analyze
automatically, then drops you in the editor view to generate images and click
*Render*.

## Where things live

```
/tmp/agil-editor-jobs/{jobId}/
  metadata.json
  raw.mp4 normalized.mp4 cut.mp4 audio.mp3 output.mp4
  subtitles.json subtitles-cut.json
  images/{sceneId}.png
  render-props.json
```

## Troubleshooting

**Port already in use**
```bash
PORT=3334 npm run dev   # or change next dev -p in package.json
```

**FFmpeg not found**
The bundled binary is installed via `@ffmpeg-installer/ffmpeg`. If it didn't
unpack on `npm install`, force a reinstall:
```bash
rm -rf node_modules/@ffmpeg-installer && npm install
```

**Whisper returns empty `words[]`**
The transcribe route already handles this: it tries `timestamp_granularities=['word','segment']` first, and falls back to a second call without that param. Watch for `[transcribe] mode=word` vs `[transcribe] mode=segment-only` in the dev log.

**Render fails with "remotion: command not found"**
Confirm the root install has it:
```bash
ls node_modules/.bin/remotion
```
The render route also falls back to `remotion/node_modules/.bin/remotion` for backwards compat.
