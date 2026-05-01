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

export default function CalloutScene({ scene }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale   = spring({ frame, fps, config: { damping: 14, stiffness: 120 }, durationInFrames: 22, from: 0.88, to: 1 });
  const opacity = spring({ frame, fps, config: { damping: 20 }, durationInFrames: 16, from: 0, to: 1 });

  const cardBg  = scene?.colorPalette?.[1] || '#FFB800';
  const textCol = isColorDark(cardBg) ? '#ffffff' : '#000000';

  const imgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const imgScale   = interpolate(frame, [0, 8], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* Bottom gradient so card stands out */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '60%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Callout card anchored near bottom */}
      <div style={{
        position: 'absolute',
        bottom: 320,
        left: 64,
        right: 64,
        opacity,
        transform: `scale(${scale})`,
      }}>
        <div style={{
          backgroundColor: cardBg,
          borderRadius: 32,
          padding: '52px 56px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
        }}>
          {/* Image as left icon */}
          {scene?.imageUrl && (
            <div style={{
              width: 200,
              height: 200,
              borderRadius: 24,
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              opacity: imgOpacity,
              transform: `scale(${imgScale})`,
              transformOrigin: 'left center',
            }}>
              <Img src={scene.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              color: textCol,
              fontFamily: 'Sora, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: 5,
              marginBottom: 20,
              opacity: 0.65,
            }}>
              Destaque
            </div>
            <div style={{
              fontSize: 64,
              fontWeight: 800,
              color: textCol,
              fontFamily: 'Sora, sans-serif',
              lineHeight: 1.1,
              marginBottom: 24,
            }}>
              {scene?.title || ''}
            </div>
            {scene?.description && (
              <div style={{
                fontSize: 38,
                fontWeight: 400,
                color: textCol,
                fontFamily: 'Sora, sans-serif',
                lineHeight: 1.5,
                opacity: 0.85,
              }}>
                {scene.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
