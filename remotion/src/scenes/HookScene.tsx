import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  scene: any;
  durationFrames: number;
}

/**
 * HOOK — pattern-interrupt overlay forced into the first ~2.5s of the video.
 * Goal: stop the scroll. Three layers:
 *   1. Impact flash (frame 0-6): white burst that fades, gives the "punch" feel.
 *   2. Vignette (constant): dark edges so the centered text reads anywhere.
 *   3. Hook text (frame 4-end): big centered title with spring-in + soft breathing.
 *
 * The background video itself shakes via VideoWithEffects when this scene's
 * animationType='shake'. Combined with the flash, it feels like a real cut-in.
 */
export default function HookScene({ scene, durationFrames }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Impact flash — sharp white burst, 6-frame decay
  const flashOpacity = interpolate(frame, [0, 2, 6], [0.55, 0.35, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Hook text enter — spring after flash settles
  const textIn = spring({
    frame: Math.max(frame - 4, 0),
    fps,
    config: { damping: 12, stiffness: 140 },
    durationInFrames: 16,
    from: 0,
    to: 1,
  });
  const textScale = interpolate(textIn, [0, 1], [0.78, 1]);

  // Subtle breathing while text is held on screen
  const breathe = interpolate(
    frame,
    [20, durationFrames - 14],
    [1, 1.04],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // Fast exit
  const exitFade = interpolate(frame, [durationFrames - 10, durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const hookText = (scene?.title ?? '').toString().trim();
  const accent = scene?.colorPalette?.[0] || '#FFD400';

  // Detect ending punctuation for visual flair
  const endsInQuestion = hookText.endsWith('?');
  const endsInExclaim  = hookText.endsWith('!');

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Layer 1 — impact flash */}
      <AbsoluteFill style={{ backgroundColor: '#ffffff', opacity: flashOpacity * exitFade }} />

      {/* Layer 2 — vignette for guaranteed legibility */}
      <AbsoluteFill
        style={{
          opacity: exitFade,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.78) 100%)',
        }}
      />

      {/* Layer 3 — hook text, centered */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 64px',
          opacity: textIn * exitFade,
          transform: `scale(${textScale * breathe})`,
        }}
      >
        <div
          style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 900,
            fontSize: hookText.length > 28 ? 96 : 124,
            lineHeight: 1.02,
            color: '#ffffff',
            textAlign: 'center',
            letterSpacing: -1,
            textShadow:
              `0 6px 24px rgba(0,0,0,0.95), 0 0 32px ${accent}66, 0 0 60px rgba(0,0,0,0.6)`,
            textTransform: 'uppercase',
            maxWidth: 960,
            wordBreak: 'break-word',
          }}
        >
          {hookText}
        </div>

        {/* Accent underline only when there's a strong ending punctuation */}
        {(endsInQuestion || endsInExclaim) && (
          <div
            style={{
              marginTop: 28,
              width: interpolate(frame, [10, 28], [0, 280], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              height: 8,
              backgroundColor: accent,
              borderRadius: 4,
              boxShadow: `0 0 18px ${accent}aa`,
            }}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
