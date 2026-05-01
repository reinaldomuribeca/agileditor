import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  scene: any;
  durationFrames: number;
}

export default function TalkingHeadScene({ scene }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = spring({ frame, fps, config: { damping: 22, stiffness: 90 }, durationInFrames: 16, from: 0, to: 1 });
  const slideY  = spring({ frame, fps, config: { damping: 18, stiffness: 80 }, durationInFrames: 20, from: -24, to: 0 });

  const accent = scene?.colorPalette?.[0] || '#FFB800';

  const imgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const imgScale   = interpolate(frame, [0, 8], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* Image badge in the top-right corner */}
      {scene?.imageUrl && (
        <div style={{
          position: 'absolute',
          top: 64,
          right: 64,
          width: 240,
          height: 240,
          borderRadius: 24,
          overflow: 'hidden',
          border: `4px solid ${accent}`,
          boxShadow: `0 12px 36px rgba(0,0,0,0.6), 0 0 24px ${accent}66`,
          opacity: imgOpacity,
          transform: `scale(${imgScale})`,
          transformOrigin: 'top right',
        }}>
          <Img src={scene.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      {/* Top gradient vignette */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '30%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Bottom gradient vignette (leaves room for subtitles) */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '45%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Compact title badge at top */}
      {scene?.title && (
        <div style={{
          position: 'absolute',
          top: 72,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity,
          transform: `translateY(${slideY}px)`,
        }}>
          <div style={{
            backgroundColor: accent,
            borderRadius: 50,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 36,
            paddingRight: 36,
            boxShadow: `0 0 28px ${accent}88`,
          }}>
            <span style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#000',
              fontFamily: 'Sora, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: 3,
            }}>
              {scene.title}
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
