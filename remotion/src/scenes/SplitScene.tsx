import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  scene: any;
  durationFrames: number;
}

/**
 * "Split" scene reinterpreted as Picture-in-Picture overlay.
 * The illustration sits in the top-right corner with a chip below it.
 * Video keeps playing full-canvas. Never bisects the frame.
 */
export default function SplitScene({ scene, durationFrames }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideX  = spring({ frame, fps, config: { damping: 16, stiffness: 80 }, durationInFrames: 22, from: 80, to: 0 });
  const opacity = spring({ frame, fps, config: { damping: 20 }, durationInFrames: 18, from: 0, to: 1 });
  const exitFade = interpolate(frame, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const finalOpacity = opacity * exitFade;

  const accent = scene?.colorPalette?.[1] || '#FFB800';

  const imgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) * exitFade;
  const imgScale   = interpolate(frame, [0, 8], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* PIP container in top-right. ~360×500 = 180k px² of 2.07M = 8.7% of canvas */}
      <div style={{
        position: 'absolute',
        top: 72,
        right: 56,
        width: 360,
        opacity: finalOpacity,
        transform: `translateX(${slideX}px)`,
      }}>
        {/* Image */}
        {scene?.imageUrl && (
          <div style={{
            width: 360,
            height: 360,
            borderRadius: 28,
            overflow: 'hidden',
            border: `5px solid ${accent}`,
            boxShadow: `0 20px 56px rgba(0,0,0,0.65), 0 0 32px ${accent}55`,
            opacity: imgOpacity,
            transform: `scale(${imgScale})`,
            transformOrigin: 'top right',
          }}>
            <Img src={scene.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Title chip below the PIP */}
        {scene?.title && (
          <div style={{
            marginTop: 16,
            backgroundColor: accent,
            borderRadius: 18,
            padding: '14px 22px',
            boxShadow: `0 12px 36px rgba(0,0,0,0.55), 0 0 24px ${accent}66`,
            textAlign: 'center',
          }}>
            <span style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#000',
              fontFamily: 'Sora, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              lineHeight: 1.1,
              display: 'block',
            }}>
              {scene.title}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
