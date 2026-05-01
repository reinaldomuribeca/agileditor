import React from 'react';
import { AbsoluteFill, Sequence, Video, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { SubtitleData, SceneData } from './types';
import TalkingHeadScene from './scenes/TalkingHeadScene';
import TextOnlyScene from './scenes/TextOnlyScene';
import CalloutScene from './scenes/CalloutScene';
import SplitScene from './scenes/SplitScene';
import CoverScene from './scenes/CoverScene';
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
}

function sentimentFilter(sentiment: string): string {
  switch (sentiment) {
    case 'exciting':  return 'saturate(1.55) contrast(1.18) brightness(1.08)';
    case 'positive':  return 'saturate(1.25) brightness(1.06)';
    case 'negative':  return 'saturate(0.68) contrast(1.14) brightness(0.9)';
    default:          return 'saturate(1.0) contrast(1.0) brightness(1.0)';
  }
}

function VideoWithEffects({ scenes, videoSrc }: { scenes: SceneWithFrames[]; videoSrc: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeScene = scenes.find(s => frame >= s.startFrame && frame < s.endFrame);

  let scaleVal   = 1;
  let txPx       = 0;
  let tyPx       = 0;
  let filterStr  = 'saturate(1) contrast(1) brightness(1)';

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
        willChange: 'transform, filter',
      }}
    />
  );
}

function SceneOverlay({ scene, durationFrames }: { scene: SceneData; durationFrames: number }) {
  switch (scene.type) {
    case 'talking_head': return <TalkingHeadScene scene={scene} durationFrames={durationFrames} />;
    case 'text_only':    return <TextOnlyScene scene={scene} durationFrames={durationFrames} />;
    case 'callout':      return <CalloutScene scene={scene} durationFrames={durationFrames} />;
    case 'split':        return <SplitScene scene={scene} durationFrames={durationFrames} />;
    case 'cover':        return <CoverScene scene={scene} durationFrames={durationFrames} />;
    default:             return null;
  }
}

export default function VideoComposition({ scenes, subtitles, videoSrc }: VideoCompositionProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>

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

      {/* ── 2. Scene overlays (text/labels on top of video) ─────── */}
      {scenes.map((scene) => {
        const duration = Math.max(scene.durationFrames, 1);
        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={duration}>
            <SceneOverlay scene={scene} durationFrames={duration} />
          </Sequence>
        );
      })}

      {/* ── 3. Subtitles — always on top ───────────────────────── */}
      <SubtitleOverlay subtitles={subtitles} />

    </AbsoluteFill>
  );
}
