import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  scene: any;
  durationFrames: number;
}

function isColorDark(hex: string): boolean {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/**
 * Callout — compact card overlay anchored bottom-left.
 * Width 600 × ~430 height ≈ 12.4% of 1080×1920 canvas. Always under the 30% cap.
 * Description is truncated to 2 lines so the card never grows.
 */
export default function CalloutScene({ scene, durationFrames }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale   = spring({ frame, fps, config: { damping: 14, stiffness: 130 }, durationInFrames: 22, from: 0.85, to: 1 });
  const opacity = spring({ frame, fps, config: { damping: 20 }, durationInFrames: 16, from: 0, to: 1 });
  const exitFade = interpolate(frame, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const finalOpacity = opacity * exitFade;

  const cardBg  = scene?.colorPalette?.[1] || '#FFB800';
  const textCol = isColorDark(cardBg) ? '#ffffff' : '#000000';

  const imgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) * exitFade;
  const imgScale   = interpolate(frame, [0, 8], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Compact callout — bottom-left, leaves room for subtitles below */}
      <div style={{
        position: 'absolute',
        bottom: 360,
        left: 56,
        width: 600,
        opacity: finalOpacity,
        transform: `scale(${scale})`,
        transformOrigin: 'bottom left',
      }}>
        <div style={{
          backgroundColor: cardBg,
          borderRadius: 24,
          padding: '24px 26px',
          boxShadow: '0 24px 56px rgba(0,0,0,0.55)',
          display: 'flex',
          gap: 18,
          alignItems: 'flex-start',
        }}>
          {/* Smaller image as left icon */}
          {scene?.imageUrl && (
            <div style={{
              width: 110,
              height: 110,
              borderRadius: 16,
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              opacity: imgOpacity,
              transform: `scale(${imgScale})`,
              transformOrigin: 'left center',
            }}>
              <Img src={scene.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: textCol,
              fontFamily: 'Sora, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: 4,
              marginBottom: 8,
              opacity: 0.7,
            }}>
              Destaque
            </div>
            <div style={{
              fontSize: 36,
              fontWeight: 800,
              color: textCol,
              fontFamily: 'Sora, sans-serif',
              lineHeight: 1.1,
              wordBreak: 'break-word',
            }}>
              {scene?.title || ''}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
