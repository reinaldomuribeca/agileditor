import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  scene: any;
  durationFrames: number;
}

/**
 * Text-only overlay — small floating card on the left edge with title.
 * Video continues full-canvas behind. Never covers center / faces.
 */
export default function TextOnlyScene({ scene, durationFrames }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideX  = spring({ frame, fps, config: { damping: 16, stiffness: 80 }, durationInFrames: 22, from: -120, to: 0 });
  const opacity = spring({ frame, fps, config: { damping: 20 }, durationInFrames: 18, from: 0, to: 1 });
  const exitFade = interpolate(frame, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const finalOpacity = opacity * exitFade;

  const accent = scene?.colorPalette?.[1] || '#FFB800';

  const imgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) * exitFade;
  const imgScale   = interpolate(frame, [0, 8], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Floating card pinned to the LEFT edge, vertically centered.
          Width: ~52% of 1080 = 560px. Height auto. Stays under 30% of canvas. */}
      <div style={{
        position: 'absolute',
        top: '38%',
        left: 56,
        width: 560,
        opacity: finalOpacity,
        transform: `translateX(${slideX}px)`,
      }}>
        {/* Optional small image at the top of the card */}
        {scene?.imageUrl && (
          <div style={{
            width: 200,
            height: 200,
            borderRadius: 20,
            overflow: 'hidden',
            border: `4px solid ${accent}`,
            boxShadow: `0 12px 36px rgba(0,0,0,0.55)`,
            marginBottom: 20,
            opacity: imgOpacity,
            transform: `scale(${imgScale})`,
            transformOrigin: 'top left',
          }}>
            <Img src={scene.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Accent bar */}
        <div style={{
          width: 64,
          height: 6,
          backgroundColor: accent,
          borderRadius: 3,
          marginBottom: 18,
          boxShadow: `0 0 20px ${accent}88`,
        }} />

        {scene?.title && (
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(8px)',
            borderRadius: 20,
            padding: '20px 28px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}>
            <span style={{
              fontSize: 56,
              fontWeight: 900,
              color: accent,
              fontFamily: 'Sora, sans-serif',
              lineHeight: 1.08,
              textShadow: `0 0 20px ${accent}55`,
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
