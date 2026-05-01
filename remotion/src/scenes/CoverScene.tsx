import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  scene: any;
  durationFrames: number;
}

/**
 * Cover scene — overlay only. Title chip at top, optional image badge at top-right corner.
 * The original video continues to play full-canvas behind. Never replace the frame.
 */
export default function CoverScene({ scene, durationFrames }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance: chip slides in from top
  const chipY    = spring({ frame, fps, config: { damping: 16, stiffness: 80 }, durationInFrames: 22, from: -60, to: 0 });
  const opacity  = spring({ frame, fps, config: { damping: 20 }, durationInFrames: 18, from: 0, to: 1 });

  // Exit: fade out in the last 10 frames so the overlay disappears, video keeps going.
  const exitFade = interpolate(frame, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const finalOpacity = opacity * exitFade;

  const accent  = scene?.colorPalette?.[1] || '#FFB800';

  // Optional image badge — top-right, ≤ 8% of the canvas.
  const imgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) * exitFade;
  const imgScale   = interpolate(frame, [0, 8], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Soft top vignette so the chip stands out — alpha gradient lets video show through */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '22%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        opacity: finalOpacity,
      }} />

      {/* Optional small image in top-right corner */}
      {scene?.imageUrl && (
        <div style={{
          position: 'absolute',
          top: 56,
          right: 56,
          width: 220,
          height: 220,
          borderRadius: 24,
          overflow: 'hidden',
          border: `4px solid ${accent}`,
          boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 24px ${accent}66`,
          opacity: imgOpacity,
          transform: `scale(${imgScale})`,
          transformOrigin: 'top right',
        }}>
          <Img src={scene.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Title chip — top center */}
      {scene?.title && (
        <div style={{
          position: 'absolute',
          top: 96,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: finalOpacity,
          transform: `translateY(${chipY}px)`,
        }}>
          <div style={{
            backgroundColor: accent,
            borderRadius: 56,
            padding: '20px 48px',
            boxShadow: `0 0 32px ${accent}88, 0 8px 24px rgba(0,0,0,0.5)`,
            maxWidth: '78%',
          }}>
            <span style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#000',
              fontFamily: 'Sora, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              lineHeight: 1.05,
              textAlign: 'center',
              display: 'block',
            }}>
              {scene.title}
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
