import React from 'react';
import { Composition } from 'remotion';
import VideoComposition from './VideoComposition';
import type { VideoCompositionProps, SceneWithFrames } from './VideoComposition';

const defaultProps: VideoCompositionProps = {
  scenes: [],
  subtitles: [],
  videoSrc: '',
};

export default function Root() {
  return (
    <Composition
      id="AgileEditor"
      component={VideoComposition as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
      calculateMetadata={async ({ props }) => {
        const p = props as unknown as VideoCompositionProps;
        if (!p.scenes || p.scenes.length === 0) return { durationInFrames: 300 };
        const lastScene = p.scenes[p.scenes.length - 1];
        const duration = Math.max((lastScene as SceneWithFrames).endFrame || 300, 30);
        return { durationInFrames: duration };
      }}
    />
  );
}
