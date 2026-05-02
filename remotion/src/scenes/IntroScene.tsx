import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

// Load Google Fonts at module init — small woff2 each.
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadFredoka } from '@remotion/google-fonts/Fredoka';
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat';
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadLora } from '@remotion/google-fonts/Lora';

const { fontFamily: interFamily }    = loadInter();
const { fontFamily: fredokaFamily }  = loadFredoka();
const { fontFamily: playfairFamily } = loadPlayfair();
const { fontFamily: caveatFamily }   = loadCaveat();
const { fontFamily: antonFamily }    = loadAnton();
const { fontFamily: loraFamily }     = loadLora();

interface Props {
  scene: any;
  durationFrames: number;
}

interface Style {
  font: string;
  weight: number;
  size: number;
  letterSpacing: number;
  lineHeight: number;
  /** entrance animation kind */
  anim: 'bounce' | 'fade-up' | 'fade-grow' | 'typewriter' | 'fade-underline' | 'flash-zoom';
}

function styleFor(contentType?: string): Style {
  switch (contentType) {
    case 'humor':       return { font: fredokaFamily,  weight: 700, size: 140, letterSpacing: -1,    lineHeight: 1.05, anim: 'bounce' };
    case 'serious':     return { font: playfairFamily, weight: 800, size: 128, letterSpacing: 0,     lineHeight: 1.10, anim: 'fade-up' };
    case 'documentary': return { font: playfairFamily, weight: 700, size: 124, letterSpacing: 0,     lineHeight: 1.10, anim: 'fade-up' };
    case 'emotional':   return { font: loraFamily,     weight: 700, size: 132, letterSpacing: -0.5,  lineHeight: 1.10, anim: 'fade-grow' };
    case 'educational': return { font: interFamily,    weight: 800, size: 130, letterSpacing: -1,    lineHeight: 1.05, anim: 'fade-underline' };
    case 'vlog':        return { font: caveatFamily,   weight: 700, size: 170, letterSpacing: 0,     lineHeight: 1.0,  anim: 'typewriter' };
    case 'commercial':  return { font: antonFamily,    weight: 400, size: 160, letterSpacing: 1,     lineHeight: 1.0,  anim: 'flash-zoom' };
    default:            return { font: 'Sora, sans-serif', weight: 900, size: 130, letterSpacing: -1, lineHeight: 1.05, anim: 'fade-up' };
  }
}

/**
 * Intro title overlay — centered, font + entrance animation chosen by content type.
 * Auto-contrasts text color based on first-frame luminance (`scene.isLightBg`).
 * Video keeps playing behind. Fades out in last 10 frames.
 */
export default function IntroScene({ scene, durationFrames }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const style = styleFor(scene?.contentType);
  const isLight = scene?.isLightBg === true;
  const textColor = isLight ? '#0a0a0a' : '#ffffff';
  const textShadow = isLight
    ? '0 2px 8px rgba(255,255,255,0.85), 0 0 24px rgba(255,255,255,0.5)'
    : '0 4px 24px rgba(0,0,0,0.95), 0 0 32px rgba(0,0,0,0.65)';
  const subColor = isLight ? '#1a1a1a' : '#f0f0f0';

  // ── Entrance animation per style ────────────────────────────────────────
  let titleOpacity = 0;
  let titleScale = 1;
  let titleTranslateY = 0;
  let typewriterChars = -1;
  let underlineWidth = 0;
  let flashOpacity = 0;

  switch (style.anim) {
    case 'bounce': {
      const sp = spring({ frame, fps, config: { damping: 9, stiffness: 130 }, durationInFrames: 24, from: 0, to: 1 });
      titleOpacity = sp;
      titleTranslateY = (1 - sp) * 80;
      titleScale = 0.85 + sp * 0.15;
      break;
    }
    case 'fade-up': {
      titleOpacity = spring({ frame, fps, config: { damping: 22 }, durationInFrames: 22, from: 0, to: 1 });
      titleTranslateY = spring({ frame, fps, config: { damping: 18, stiffness: 80 }, durationInFrames: 26, from: 24, to: 0 });
      break;
    }
    case 'fade-grow': {
      titleOpacity = interpolate(frame, [0, 28], [0, 1], { extrapolateRight: 'clamp' });
      titleScale = interpolate(frame, [0, 36], [0.92, 1.0], { extrapolateRight: 'clamp' });
      break;
    }
    case 'typewriter': {
      titleOpacity = 1;
      // Reveal a character every 1.6 frames for a hand-typed feel.
      typewriterChars = Math.floor(frame / 1.6);
      titleTranslateY = spring({ frame, fps, config: { damping: 18, stiffness: 90 }, durationInFrames: 18, from: 18, to: 0 });
      break;
    }
    case 'fade-underline': {
      titleOpacity = spring({ frame, fps, config: { damping: 22 }, durationInFrames: 18, from: 0, to: 1 });
      underlineWidth = interpolate(frame, [10, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      break;
    }
    case 'flash-zoom': {
      titleOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
      titleScale = interpolate(frame, [0, 8, 14], [1.18, 0.96, 1.0], { extrapolateRight: 'clamp' });
      flashOpacity = interpolate(frame, [0, 4, 10], [0.85, 0.3, 0], { extrapolateRight: 'clamp' });
      break;
    }
  }

  // Exit fade in last 10 frames so the intro disappears cleanly while video plays on.
  const exitFade = interpolate(frame, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  titleOpacity = titleOpacity * exitFade;

  // Subtitle fades in slightly after the title.
  const subOpacity = interpolate(frame, [12, 32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * exitFade;
  const subTranslateY = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 22 }, durationInFrames: 22, from: 16, to: 0 });

  const titleText = scene?.title ?? '';
  const displayedTitle = typewriterChars >= 0 ? titleText.slice(0, typewriterChars + 1) : titleText;

  // Soft radial backdrop for readability — keeps video visible at edges, dims center.
  const backdropOpacity = interpolate(frame, [0, 14], [0, isLight ? 0.32 : 0.5], { extrapolateRight: 'clamp' }) * exitFade;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Soft radial darken/lighten — never fully opaque, video shows through */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isLight
          ? `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,${backdropOpacity}) 0%, transparent 60%)`
          : `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,${backdropOpacity}) 0%, transparent 60%)`,
      }} />

      {/* Optional flash burst for commercial style */}
      {flashOpacity > 0.02 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,1) 0%, transparent 35%)',
          opacity: flashOpacity,
          mixBlendMode: 'screen',
        }} />
      )}

      {/* Centered title + subtitle */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
        textAlign: 'center',
      }}>
        {/* Title */}
        <div style={{
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px) scale(${titleScale})`,
          maxWidth: '92%',
        }}>
          <span style={{
            fontFamily: style.font,
            fontWeight: style.weight,
            fontSize: style.size,
            letterSpacing: style.letterSpacing,
            lineHeight: style.lineHeight,
            color: textColor,
            textShadow,
            display: 'block',
          }}>
            {displayedTitle}
          </span>

          {/* Educational underline — animated width */}
          {style.anim === 'fade-underline' && (
            <div style={{
              width: `${underlineWidth * 70}%`,
              height: 6,
              backgroundColor: scene?.colorPalette?.[1] || '#FFB800',
              margin: '20px auto 0',
              borderRadius: 4,
              boxShadow: `0 0 20px ${(scene?.colorPalette?.[1] || '#FFB800')}aa`,
            }} />
          )}
        </div>

        {/* Subtitle */}
        {scene?.subtitle && (
          <div style={{
            marginTop: 28,
            opacity: subOpacity,
            transform: `translateY(${subTranslateY}px)`,
            maxWidth: '85%',
          }}>
            <span style={{
              fontFamily: style.font,
              fontWeight: Math.max(400, style.weight - 300),
              fontSize: Math.round(style.size * 0.36),
              letterSpacing: 0,
              lineHeight: 1.3,
              color: subColor,
              textShadow,
              opacity: 0.92,
              display: 'block',
            }}>
              {scene.subtitle}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
