# Ágil Editor — Architecture

## Stack

- **Next.js 14.2.21** (App Router) — UI + API routes, port 3333
- **Remotion 4.0.434** — composition + headless render via CLI
- **FFmpeg 4.4** via `@ffmpeg-installer/ffmpeg` (bundled binary, no system install)
- **Whisper** — Groq `whisper-large-v3` preferred, OpenAI `whisper-1` fallback
- **Anthropic Claude** — `claude-sonnet-4-6` for scene analysis
- **OpenAI Images** — `gpt-image-1` for scene illustrations

## Storage

File-based, single-process. All job artifacts live under
`${JOBS_DIR:-/tmp/agil-editor-jobs}/{jobId}/`:

```
{jobId}/
├── metadata.json        # the source of truth (status, paths, subtitles, analysis, ...)
├── raw.mp4              # original upload
├── normalized.mp4       # H.264 30fps CFR
├── audio.mp3            # 16kHz mono extracted for Whisper
├── subtitles.json       # post-Whisper, per-segment with words[]
├── subtitles-cut.json   # subtitles re-timed for cut.mp4
├── cut.mp4              # silence-stripped video
├── images/{sceneId}.png # per-scene illustration (1024x1024)
├── render-props.json    # serialized props handed to Remotion
└── output.mp4           # final 1080x1920 H.264
```

## Pipeline

The client (`app/editor/[jobId]/page.tsx`) polls `/api/job?id=…` every 2s and
fires the next API route as the status advances:

```
upload → normalize → transcribe → cut-silence → analyze → editing → render
   1         2           3            4            5          6        7
```

| Step | Status | Endpoint | Reads | Writes |
|---|---|---|---|---|
| 1 | `uploading` | `POST /api/upload` | multipart MP4 | `raw.mp4`, `metadata.json` |
| 2 | `normalizing` | `POST /api/normalize` | `videoPath` | `normalized.mp4`, `duration` |
| 3 | `transcribing` | `POST /api/transcribe` | `normalizedPath` | `audio.mp3`, `subtitles[]` (with `words[]` + sentiment) |
| 4 | `cutting-silence` | `POST /api/cut-silence` | `subtitles`, `normalizedPath` | `cut.mp4`, `subtitlesCut[]`, `silenceCutSeconds` |
| 5 | `analyzing` | `POST /api/analyze` | `subtitlesCut` (or `subtitles`) | `analysis.scenes[]` |
| 6 | `editing` | UI | (user) | `analysis.scenes[i].imageUrl` (via `/api/generate-image`) |
| 7 | `rendering` | `POST /api/render` | everything | `output.mp4` |

Each route is idempotent: re-POSTing on a job that already has the artifact
short-circuits and returns `{skipped: true}`.

## Key concepts

### Silence cut (Phase 1)

`lib/silence.ts` is pure (no I/O). Two functions:

- `computeKeepSegments(subtitles, {minGap=0.8, paddingStart=0.05, paddingEnd=0.05})`
  - Builds a padded range per subtitle: `[s.start - 0.05, s.end + 0.05]`.
  - Merges adjacent ranges whose gap is `< minGap`.
  - Returns segments to keep, each with `cumulativeRemoved` (seconds removed before this segment).
- `shiftSubtitles(subtitles, keepSegments)`
  - For each subtitle, finds its keep segment and subtracts that segment's `cumulativeRemoved` from `start`/`end` and from each `word.start`/`word.end`.
  - Subtitles whose `start` falls inside silence are dropped.

The `/api/cut-silence` route runs one ffmpeg pass with a `filter_complex`
chain of `trim` + `atrim` + `setpts` + `asetpts` + `concat`.

### Word-level sentiment (Phase 2)

`lib/sentiment.ts` exports:

- `normalizeWord(s)` — NFD normalize, strip combining diacritics, lowercase, keep alphanum.
- `classify(word) → 'positive' | 'negative' | 'neutral'` — deterministic lookup against PT-BR lexicons of ~80 words each.

Cosmetic only. False positives don't break anything; they just color a word.

### Scene timing — `startLeg`

Scenes in Claude's output use **subtitle indices** (`startLeg`), not frame
numbers. `lib/scenes.ts:convertScenesFromLegendaIndex(scenes, subs)` converts
each scene's `startLeg` into `startFrame`/`endFrame` using the subtitle's
`start` time × 30 fps. The render route always passes `subtitlesCut` (not
`subtitles`) when present — the timeline is the cut one.

### Scene types

| Type | Layout (with imageUrl) | Layout (text-only) |
|---|---|---|
| `cover` | full-frame bg image + title | gradient + title |
| `talking_head` | accent-bordered image badge top-right + title pill | title pill only |
| `text_only` | image top half + title bottom | centered title |
| `callout` | image-icon left + card text right | card-only |
| `split` | image top half + text panel bottom | text panel only |

All scene components apply a spring entrance to the `<Img>` (opacity 0→1, scale 0.9→1, 8 frames).

### Subtitle overlay

`SubtitleOverlay.tsx` finds the active subtitle, then per-word renders an
`<ActiveWord>` that:

- looks up `sentimentColors[sentiment]` (`positive=#22c55e`, `negative=#ef4444`, `neutral=#fff`, `exciting=#00D4FF`);
- applies `interpolate(local, [0,4], [0.95, 1.0])` scale punch on activation;
- shows inactive words at `rgba(255,255,255,0.65)`, fontSize 36; active words bumped to fontSize 40 weight 800.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/upload` | Multipart MP4 → jobId |
| `GET` | `/api/job?id=…` | Job metadata |
| `GET` | `/api/jobs` | List all jobs (for `/gallery`) |
| `POST` | `/api/normalize` | Re-encode to H.264 30fps |
| `POST` | `/api/transcribe` | Whisper, populates `words[]` + sentiment |
| `POST` | `/api/cut-silence` | Trim+atrim+concat; outputs `cut.mp4` + `subtitlesCut` |
| `POST` | `/api/analyze` | Claude → scenes |
| `POST` | `/api/reanalyze` | Re-run Claude with new prompt |
| `POST` | `/api/generate-image` | gpt-image-1 → `images/{sceneId}.png` |
| `POST` | `/api/render` | Remotion → `output.mp4` |
| `GET` | `/api/video/{jobId}/{path}` | Stream MP4/MP3/PNG/JSON with Range |
| `GET` | `/api/health` | FFmpeg + keys + storage status |

## Where to run things

- **Dev**: `npm run dev` (Next.js + Remotion in one Node process). FFmpeg via the bundled binary.
- **Tests**: `npm test` (node:test + tsx, pure-function tests for silence math).
- **Build**: `npm run build` (Next.js production build).

## Production scaling

This codebase is single-process and file-system-bound. Before scaling:

- Move `metadata.json` to a database; jobs to S3/GCS.
- Queue normalize/transcribe/cut/analyze/render (Bull/SQS).
- Move Remotion render to Lambda (`@remotion/lambda`) — same composition.
- Lift the per-job dir convention into an object-store key prefix.
