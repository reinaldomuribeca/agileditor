import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  scene: any;
  durationFrames: number;
}

export default function SplitScene({ scene }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideY  = spring({ frame, fps, config: { damping: 16, stiffness: 80 }, durationInFrames: 25, from: 80, to: 0 });
  const opacity = spring({ frame, fps, config: { damping: 20 }, durationInFrames: 18, from: 0, to: 1 });

  const accent = scene?.colorPalette?.[1] || '#FFB800';

  const imgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const imgScale   = interpolate(frame, [0, 8], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* Top half: image (when available) */}
      {scene?.imageUrl && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          overflow: 'hidden',
          opacity: imgOpacity,
          transform: `scale(${imgScale})`,
          transformOrigin: 'center top',
        }}>
          <Img src={scene.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Soft edge between halves */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '20%',
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.85))',
          }} />
        </div>
      )}

      {/* Bottom panel overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '45%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 60%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Text content at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 280,
        left: 0,
        right: 0,
        padding: '0 64px',
        opacity,
        transform: `translateY(${slideY}px)`,
      }}>
        {/* Accent bar */}
        <div style={{
          width: 80,
          height: 6,
          backgroundColor: accent,
          borderRadius: 3,
          marginBottom: 24,
        }} />

        {scene?.title && (
          <div style={{
            fontSize: 70,
            fontWeight: 800,
            color: '#fff',
            fontFamily: 'Sora, sans-serif',
            lineHeight: 1.1,
            textShadow: '0 4px 16px rgba(0,0,0,0.8)',
          }}>
            {scene.title}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
