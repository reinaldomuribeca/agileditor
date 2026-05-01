import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { SubtitleData, WordData } from '../types';

const FPS = 30;

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22c55e',  // green
  negative: '#ef4444',  // red
  exciting: '#00D4FF',  // cyan (legacy from analysis sentiment)
  neutral:  '#ffffff',
};

interface SubtitleOverlayProps {
  subtitles: SubtitleData[];
}

interface ActiveWordProps {
  word: WordData;
  timeSec: number;
  frame: number;
}

function ActiveWord({ word, timeSec, frame }: ActiveWordProps) {
  const isActive = timeSec >= word.start && timeSec < word.end;

  // Frames-since-activation: 0 at the moment the word becomes active.
  const activationFrame = Math.round(word.start * FPS);
  const local = frame - activationFrame;

  // Quick scale punch on the first 4 frames after activation: 0.95 → 1.0.
  const scale = isActive
    ? interpolate(local, [0, 4], [0.95, 1.0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  const sentiment = word.sentiment ?? 'neutral';
  const color = isActive
    ? (SENTIMENT_COLORS[sentiment] ?? SENTIMENT_COLORS.neutral)
    : 'rgba(255,255,255,0.65)';

  return (
    <span
      style={{
        color,
        fontWeight: isActive ? 800 : 600,
        fontSize: isActive ? 40 : 36,
        marginRight: 6,
        display: 'inline-block',
        textShadow: '0 2px 8px rgba(0,0,0,0.9)',
        lineHeight: 1.4,
        transform: `scale(${scale})`,
        transformOrigin: 'center bottom',
        willChange: 'transform, color',
      }}
    >
      {word.word}
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
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          borderRadius: 18,
          padding: '14px 28px',
        }}
      >
        {currentSub.words.length > 0 ? (
          /* Word-by-word highlight when timestamps available */
          currentSub.words.map((word, idx) => (
            <ActiveWord key={idx} word={word} timeSec={timeSec} frame={frame} />
          ))
        ) : (
          /* Segment-level: show full text */
          <span
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 38,
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              lineHeight: 1.4,
            }}
          >
            {currentSub.text}
          </span>
        )}
      </div>
    </div>
  );
}
