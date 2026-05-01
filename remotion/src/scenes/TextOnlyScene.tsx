import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  scene: any;
  durationFrames: number;
}

export default function TextOnlyScene({ scene }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideY  = spring({ frame, fps, config: { damping: 15, stiffness: 80 }, durationInFrames: 25, from: 60, to: 0 });
  const opacity = spring({ frame, fps, config: { damping: 20 }, durationInFrames: 18, from: 0, to: 1 });

  const accent = scene?.colorPalette?.[1] || '#FFB800';

  const imgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const imgScale   = interpolate(frame, [0, 8], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* Dark overlay so text is readable */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        pointerEvents: 'none',
      }} />

      {/* Image at the top half */}
      {scene?.imageUrl && (
        <div style={{
          position: 'absolute',
          top: 120,
          left: 80,
          right: 80,
          height: 720,
          borderRadius: 32,
          overflow: 'hidden',
          opacity: imgOpacity,
          transform: `scale(${imgScale})`,
          transformOrigin: 'center top',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}>
          <Img src={scene.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Title — centered (no image) or near bottom (with image) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: scene?.imageUrl ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: scene?.imageUrl ? '0 80px 360px' : '80px',
      }}>
        <div style={{
          opacity,
          transform: `translateY(${slideY}px)`,
          textAlign: 'center',
        }}>
          {scene?.title && (
            <div style={{
              fontSize: 84,
              fontWeight: 800,
              color: accent,
              fontFamily: 'Sora, sans-serif',
              lineHeight: 1.05,
              textShadow: `0 0 40px ${accent}66`,
            }}>
              {scene.title}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}
