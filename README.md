# Ágil Editor — AI-Powered Video Editing

Upload a vertical video → get back a polished 9:16 short with silence removed,
word-by-word captions, and AI-generated illustrations on the key beats.

## Architecture

- **Next.js 14** app (UI + API routes) on port 3333
- **Remotion 4.0.434** as the renderer (same version pinned at root and in `remotion/`)
- **FFmpeg** via `@ffmpeg-installer/ffmpeg` (no system install needed)
- **Whisper** (Groq `whisper-large-v3` if `GROQ_API_KEY` set, else OpenAI `whisper-1`)
- **Anthropic Claude** (`claude-sonnet-4-6`) for scene analysis
- **OpenAI Images** (`gpt-image-1`) for per-scene illustrations

## Pipeline

```
upload → normalize → transcribe → cut-silence → analyze → editing → render
```

| Step | Endpoint | What happens |
|---|---|---|
| 1. Upload | `POST /api/upload` | MP4 saved as `raw.mp4`; jobId UUID returned. |
| 2. Normalize | `POST /api/normalize` | FFmpeg → H.264 30 fps CFR, AAC 44.1 kHz, faststart. Output: `normalized.mp4`. |
| 3. Transcribe | `POST /api/transcribe` | Whisper with `timestamp_granularities=[word, segment]`; falls back to segment-only if empty. Word-level sentiment via PT-BR lexicon (`lib/sentiment.ts`). |
| 4. Cut silence | `POST /api/cut-silence` | Gaps ≥ 0.8s between subtitles → trim+atrim+concat in one ffmpeg pass. Re-times subtitles to the new timeline. Output: `cut.mp4`, `subtitlesCut`. |
| 5. Analyze | `POST /api/analyze` | Claude returns viral-style scenes (`startLeg`, type, palette, `imagePrompt`, animation). |
| 6. Editing UI | `/editor/[jobId]` | Per-scene "Generate image" button + bulk "Generate all" (concurrency 3). |
| 7. Render | `POST /api/render` | Remotion CLI renders `output.mp4` from `cut.mp4` + `subtitlesCut` + scenes + images. |

## Quickstart

```bash
# 1. Install (single npm install — Remotion CLI/bundler/renderer are at root)
npm install

# 2. Configure
cp .env.local.example .env.local
# Fill in:
#   OPENAI_API_KEY=sk-...        (Whisper fallback + image generation)
#   ANTHROPIC_API_KEY=sk-ant-... (scene analysis)
#   GROQ_API_KEY=...             (optional, free Whisper)

# 3. Run
npm run dev   # → http://localhost:3333
```

## Features

- **Auto silence cutting** — drops gaps ≥ 0.8s between speech, with 50 ms padding around each subtitle.
- **Word-by-word captions** — spring scale-in (0.95→1.0 in 4 frames) per word; sentiment colors (positive=green, negative=red, neutral=white).
- **Per-scene illustrations** — Claude generates an `imagePrompt`, you click *Gerar imagem*, gpt-image-1 returns a 1024×1024 PNG, scene Remotion components render it with a spring entrance.
- **Re-edit on the fly** — change the user prompt, re-run analyze, get new scenes from the same transcript.

## Format

- 1080×1920 (9:16), 30 fps, H.264, yuv420p
- Job artifacts in `${JOBS_DIR:-/tmp/agil-editor-jobs}/{jobId}/`:
  - `raw.mp4`, `normalized.mp4`, `audio.mp3`
  - `subtitles.json`, `subtitles-cut.json`, `cut.mp4`
  - `images/{sceneId}.png`
  - `metadata.json` (status + everything above), `output.mp4` (final)

## Tests

```bash
npm test    # unit tests for lib/silence.ts (computeKeepSegments + shiftSubtitles)
```

## Health check

```bash
curl http://localhost:3333/api/health
```
Returns FFmpeg path/version, OPENAI/ANTHROPIC keys present, jobs dir + image-subdir writable.
