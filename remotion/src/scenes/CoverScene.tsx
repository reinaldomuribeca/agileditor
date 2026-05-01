import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  scene: any;
  durationFrames: number;
}

export default function CoverScene({ scene, durationFrames }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity  = spring({ frame, fps, config: { damping: 20 }, durationInFrames: 18, from: 0, to: 1 });
  const slideY   = spring({ frame, fps, config: { damping: 16, stiffness: 65 }, durationInFrames: 26, from: 50, to: 0 });
  const lineW    = spring({ frame, fps, config: { damping: 18, stiffness: 80 }, durationInFrames: 22, from: 0, to: 80 });

  // Pulse the accent line
  const pulse    = interpolate(Math.sin(frame * 0.12), [-1, 1], [0.7, 1.0]);

  const accent   = scene?.colorPalette?.[1] || '#FFB800';
  const accent2  = scene?.colorPalette?.[2] || '#FF4500';

  // Image entrance: opacity 0→1 + scale 0.9→1 over the first 8 frames
  const imgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const imgScale   = interpolate(frame, [0, 8], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* Background image (when available) */}
      {scene?.imageUrl && (
        <Img
          src={scene.imageUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imgOpacity,
            transform: `scale(${imgScale})`,
            transformOrigin: 'center center',
          }}
        />
      )}

      {/* Cinematic dark gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: scene?.imageUrl
          ? 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.7) 100%)'
          : 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.8) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Centered content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 72px',
        opacity,
        transform: `translateY(${slideY}px)`,
        textAlign: 'center',
      }}>
        {/* Animated accent line */}
        <div style={{
          width: lineW,
          height: 6,
          backgroundColor: accent,
          borderRadius: 4,
          marginBottom: 48,
          boxShadow: `0 0 32px ${accent}cc`,
          opacity: pulse,
        }} />

        {scene?.title && (
          <div style={{
            fontSize: 88,
            fontWeight: 900,
            color: '#fff',
            fontFamily: 'Sora, sans-serif',
            lineHeight: 1.05,
            textShadow: `0 4px 32px rgba(0,0,0,0.95), 0 0 60px ${accent}55`,
            letterSpacing: -1,
          }}>
            {scene.title}
          </div>
        )}

        {/* Thin colored rule */}
        <div style={{
          width: 48,
          height: 4,
          backgroundColor: accent2,
          borderRadius: 2,
          marginTop: 40,
          opacity: 0.8,
        }} />
      </div>
    </AbsoluteFill>
  );
}
