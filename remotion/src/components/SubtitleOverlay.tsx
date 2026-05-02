import { useCurrentFrame, interpolate } from 'remotion';
import { SubtitleData, WordData } from '../types';

const FPS = 30;
const MAX_CHARS_PER_LINE = 26;

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22c55e',  // green
  negative: '#ef4444',  // red
  exciting: '#00D4FF',  // cyan (legacy from analysis sentiment)
  neutral:  '#ffffff',
};

interface SubtitleOverlayProps {
  subtitles: SubtitleData[];
}

interface RenderedWord {
  word: WordData;
  displayText: string;
  isPunch: boolean;
}

// Punch = word that should grab attention even when not the active spoken word.
// Heuristic: original-text CAPS (transcript emphasis) OR non-neutral sentiment.
function detectPunch(word: WordData, displayText: string): boolean {
  const stripped = displayText.replace(/[^\p{L}]/gu, '');
  if (stripped.length >= 3 && stripped === stripped.toUpperCase() && /[A-ZÀ-Ý]/.test(stripped)) {
    return true;
  }
  if (word.sentiment && word.sentiment !== 'neutral') {
    return true;
  }
  return false;
}

// Greedy line wrap respecting word boundaries; ~26 chars/line is the sweet spot
// for 9:16 vertical with the chosen font size (readable at 1 glance, no overflow).
function chunkIntoLines(rendered: RenderedWord[], maxChars: number): RenderedWord[][] {
  const lines: RenderedWord[][] = [];
  let current: RenderedWord[] = [];
  let currentLen = 0;

  for (const item of rendered) {
    const wordLen = item.displayText.length;
    const addLen  = current.length === 0 ? wordLen : wordLen + 1; // +1 for space
    if (currentLen + addLen > maxChars && current.length > 0) {
      lines.push(current);
      current = [item];
      currentLen = wordLen;
    } else {
      current.push(item);
      currentLen += addLen;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

interface ActiveWordProps {
  word: WordData;
  displayText: string;
  isPunch: boolean;
  timeSec: number;
  frame: number;
}

function ActiveWord({ word, displayText, isPunch, timeSec, frame }: ActiveWordProps) {
  const isActive = timeSec >= word.start && timeSec < word.end;

  const activationFrame = Math.round(word.start * FPS);
  const local = frame - activationFrame;

  const scale = isActive
    ? interpolate(local, [0, 4], [0.92, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;

  const sentiment = word.sentiment ?? 'neutral';
  const sentimentColor = SENTIMENT_COLORS[sentiment] ?? SENTIMENT_COLORS.neutral;

  // Color logic:
  //  - active        → sentiment color
  //  - punch idle    → soft white (more visible than regular idle)
  //  - regular idle  → dimmed white
  const color = isActive
    ? sentimentColor
    : isPunch
      ? 'rgba(255,255,255,0.95)'
      : 'rgba(255,255,255,0.55)';

  // Size logic — punch words are noticeably bigger even when idle
  const baseSize   = isPunch ? 44 : 36;
  const activeSize = isPunch ? 54 : 42;
  const fontSize   = isActive ? activeSize : baseSize;

  // Weight — punch always heavy; active heavier still
  const fontWeight = isActive ? 900 : isPunch ? 800 : 600;

  // Glow — only on active or punch words
  const glow = isActive
    ? `0 0 18px ${sentimentColor}cc, 0 2px 8px rgba(0,0,0,0.95)`
    : isPunch
      ? '0 2px 10px rgba(0,0,0,0.95), 0 0 14px rgba(255,255,255,0.18)'
      : '0 2px 8px rgba(0,0,0,0.9)';

  return (
    <span
      style={{
        color,
        fontWeight,
        fontSize,
        marginRight: 8,
        display: 'inline-block',
        textShadow: glow,
        lineHeight: 1.18,
        transform: `scale(${scale})`,
        transformOrigin: 'center bottom',
        letterSpacing: isPunch ? 0.5 : 0,
      }}
    >
      {displayText}
    </span>
  );
}

export default function SubtitleOverlay({ subtitles }: SubtitleOverlayProps) {
  const frame = useCurrentFrame();
  const timeSec = frame / FPS;

  const currentSub = subtitles.find(
    (sub) => sub.start <= timeSec && sub.end > timeSec,
  );

  if (!currentSub) return null;

  // Word-level path with intelligent line wrapping
  if (currentSub.words.length > 0) {
    // Recover punctuation from the segment text (Whisper strips it from word tokens)
    const tokens = currentSub.text.trim().split(/\s+/);
    const rendered: RenderedWord[] = currentSub.words.map((w, i) => {
      const displayText = tokens[i] ?? w.word;
      return { word: w, displayText, isPunch: detectPunch(w, displayText) };
    });
    const lines = chunkIntoLines(rendered, MAX_CHARS_PER_LINE);

    return (
      <div
        style={{
          position: 'absolute',
          bottom: 180,
          left: 0,
          right: 0,
          textAlign: 'center',
          paddingLeft: 52,
          paddingRight: 52,
          fontFamily: 'Sora, sans-serif',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            maxWidth: 920,
            backgroundColor: 'rgba(8,8,12,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 22,
            padding: '16px 30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
          }}
        >
          {lines.map((line, lineIdx) => (
            <div key={lineIdx} style={{ whiteSpace: 'nowrap', lineHeight: 1.18 }}>
              {line.map((item, idx) => (
                <ActiveWord
                  key={`${lineIdx}-${idx}`}
                  word={item.word}
                  displayText={item.displayText}
                  isPunch={item.isPunch}
                  timeSec={timeSec}
                  frame={frame}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Segment-level fallback (no word timing) — also wrap into lines for readability
  const segLines: string[] = [];
  {
    const words = currentSub.text.trim().split(/\s+/);
    let cur = '';
    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      if (candidate.length > MAX_CHARS_PER_LINE && cur) {
        segLines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) segLines.push(cur);
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 180,
        left: 0,
        right: 0,
        textAlign: 'center',
        paddingLeft: 52,
        paddingRight: 52,
        fontFamily: 'Sora, sans-serif',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          maxWidth: 920,
          backgroundColor: 'rgba(8,8,12,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 22,
          padding: '16px 30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
        }}
      >
        {segLines.map((line, idx) => (
          <div
            key={idx}
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 38,
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              lineHeight: 1.18,
              whiteSpace: 'nowrap',
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
