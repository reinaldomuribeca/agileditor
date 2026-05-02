import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, Sequence, Video, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { SubtitleData, SceneData, SoundtrackData } from './types';
import TalkingHeadScene from './scenes/TalkingHeadScene';
import TextOnlyScene from './scenes/TextOnlyScene';
import CalloutScene from './scenes/CalloutScene';
import SplitScene from './scenes/SplitScene';
import CoverScene from './scenes/CoverScene';
import IntroScene from './scenes/IntroScene';
import HookScene from './scenes/HookScene';
import SubtitleOverlay from './components/SubtitleOverlay';

export interface SceneWithFrames extends SceneData {
  startFrame: number;
  endFrame: number;
  durationFrames: number;
}

export interface VideoCompositionProps {
  scenes: SceneWithFrames[];
  subtitles: SubtitleData[];
  videoSrc?: string;
  soundtrack?: SoundtrackData;
}

function sentimentFilter(sentiment: string): string {
  switch (sentiment) {
    case 'exciting':  return 'saturate(1.55) contrast(1.18) brightness(1.08)';
    case 'positive':  return 'saturate(1.25) brightness(1.06)';
    case 'negative':  return 'saturate(0.68) contrast(1.14) brightness(0.9)';
    default:          return 'none';
  }
}

function VideoWithEffects({ scenes, videoSrc }: { scenes: SceneWithFrames[]; videoSrc: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeScene = scenes.find(s => frame >= s.startFrame && frame < s.endFrame);

  let scaleVal   = 1;
  let txPx       = 0;
  let tyPx       = 0;
  let filterStr  = 'none';

  if (activeScene) {
    const local = frame - activeScene.startFrame;
    const dur   = Math.max(activeScene.durationFrames, 1);

    switch (activeScene.animationType) {
      case 'zoom_in': {
        scaleVal = interpolate(local, [0, dur], [1.0, 1.22], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        break;
      }
      case 'shake': {
        // Sharp impact shake: decays to zero after ~20 frames
        const amp = interpolate(local, [0, 6, 14, 22], [14, 10, 4, 0], { extrapolateRight: 'clamp' });
        txPx = Math.sin(local * 1.8) * amp;
        tyPx = Math.cos(local * 1.4) * amp * 0.45;
        // Pair with a quick zoom punch
        scaleVal = interpolate(local, [0, 4, 14], [1.06, 1.0, 1.0], { extrapolateRight: 'clamp' });
        break;
      }
      case 'bounce': {
        const sp = spring({ frame: local, fps, config: { damping: 7, stiffness: 220 } });
        tyPx     = (1 - sp) * -28;
        scaleVal = interpolate(local, [0, dur], [1.0, 1.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        break;
      }
      default: {
        // Ken Burns — very slow creep zoom so video never looks static
        scaleVal = interpolate(local, [0, dur], [1.0, 1.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        break;
      }
    }

    filterStr = sentimentFilter(activeScene.sentiment);
  }

  const transform = `scale(${scaleVal}) translate(${txPx}px, ${tyPx}px)`;

  return (
    <Video
      src={videoSrc}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform,
        filter: filterStr,
        transformOrigin: 'center center',
      }}
    />
  );
}

function SceneOverlay({ scene, durationFrames }: { scene: SceneData; durationFrames: number }) {
  switch (scene.type) {
    case 'hook':         return <HookScene scene={scene} durationFrames={durationFrames} />;
    case 'intro':        return <IntroScene scene={scene} durationFrames={durationFrames} />;
    case 'talking_head': return <TalkingHeadScene scene={scene} durationFrames={durationFrames} />;
    case 'text_only':    return <TextOnlyScene scene={scene} durationFrames={durationFrames} />;
    case 'callout':      return <CalloutScene scene={scene} durationFrames={durationFrames} />;
    case 'split':        return <SplitScene scene={scene} durationFrames={durationFrames} />;
    case 'cover':        return <CoverScene scene={scene} durationFrames={durationFrames} />;
    default:             return null;
  }
}

const CROSSFADE_FRAMES = 8;

/**
 * Sidechain-style ducking: music drops while speech is active and recovers
 * gently when it stops. Asymmetric envelope mirrors how a human audio engineer
 * would set a compressor — fast attack so voice cuts through immediately,
 * slow release so the music doesn't pop back up between breaths.
 */
function Soundtrack({ soundtrack, subtitles }: { soundtrack: SoundtrackData; subtitles: SubtitleData[] }) {
  const { fps, durationInFrames } = useVideoConfig();
  const { src, baseVolume, duckedVolume } = soundtrack;

  const volumes = useMemo(() => {
    const out = new Float32Array(durationInFrames);
    if (durationInFrames === 0) return out;

    // Step 1 — per-frame target volume (binary: ducked while any subtitle is speaking)
    const targets = new Float32Array(durationInFrames);
    for (let f = 0; f < durationInFrames; f++) {
      const t = f / fps;
      let speaking = false;
      for (const s of subtitles) {
        if (s.start <= t && s.end > t) { speaking = true; break; }
      }
      targets[f] = speaking ? duckedVolume : baseVolume;
    }

    // Step 2 — asymmetric envelope smoothing
    //   attack (target < cur, voice starts) ~100 ms → coeff 0.35
    //   release (target > cur, voice stops) ~330 ms → coeff 0.10
    let cur = targets[0];
    for (let i = 0; i < durationInFrames; i++) {
      const t = targets[i];
      const coeff = t < cur ? 0.35 : 0.10;
      cur += (t - cur) * coeff;
      out[i] = cur;
    }
    return out;
  }, [subtitles, durationInFrames, fps, baseVolume, duckedVolume]);

  return (
    <Audio
      src={src}
      volume={(f: number) => volumes[f] ?? baseVolume}
      loop
    />
  );
}

function CrossfadeWrapper({
  naturalDuration,
  addTail,
  children,
}: {
  naturalDuration: number;
  addTail: boolean;
  children: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  const tailOpacity = addTail
    ? interpolate(
        frame,
        [naturalDuration, naturalDuration + CROSSFADE_FRAMES],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
      )
    : 1;
  return (
    <AbsoluteFill style={{ opacity: tailOpacity, pointerEvents: 'none' }}>
      {children}
    </AbsoluteFill>
  );
}

export default function VideoComposition({ scenes, subtitles, videoSrc, soundtrack }: VideoCompositionProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>

      {/* ── 0. Background music with sidechain-style ducking ───── */}
      {soundtrack?.src && (
        <Soundtrack soundtrack={soundtrack} subtitles={subtitles} />
      )}

      {/* ── 1. Video with dynamic effects (zoom, shake, color grade) */}
      {videoSrc ? (
        <VideoWithEffects scenes={scenes} videoSrc={videoSrc} />
      ) : (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#050508' }}>
          <div style={{ color: '#FFB800', fontSize: 48, fontFamily: 'sans-serif', fontWeight: 800 }}>
            Ágil Editor
          </div>
        </AbsoluteFill>
      )}

      {/* ── 2. Scene overlays with crossfade (each scene's tail overlaps the next by CROSSFADE_FRAMES) */}
      {scenes.map((scene, idx) => {
        const duration  = Math.max(scene.durationFrames, 1);
        const isLast    = idx === scenes.length - 1;
        const tail      = isLast ? 0 : CROSSFADE_FRAMES;
        // Pass extended duration so inner exitFade triggers later — wrapper handles the visible crossfade.
        const innerDur  = duration + tail;
        const seqDur    = duration + tail;
        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={seqDur}>
            <CrossfadeWrapper naturalDuration={duration} addTail={!isLast}>
              <SceneOverlay scene={scene} durationFrames={innerDur} />
            </CrossfadeWrapper>
          </Sequence>
        );
      })}

      {/* ── 3. Subtitles — always on top ───────────────────────── */}
      <SubtitleOverlay subtitles={subtitles} />

    </AbsoluteFill>
  );
}
