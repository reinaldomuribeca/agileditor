import { SceneInput, SceneWithFrames, Subtitle } from './types';

const FPS = 30;

/**
 * Clamp Claude's `startLeg` (a subtitle index) into [0, subtitles.length - 1].
 * Logs when a scene is out of range so we can spot prompt drift.
 */
function clampStartLeg(raw: number, sceneId: string, subsLen: number): number {
  if (!Number.isFinite(raw) || raw < 0) {
    console.warn(`[scenes] ${sceneId} startLeg=${raw} clamped to 0`);
    return 0;
  }
  if (raw >= subsLen) {
    const clamped = subsLen - 1;
    console.warn(`[scenes] ${sceneId} startLeg=${raw} >= ${subsLen} clamped to ${clamped}`);
    return clamped;
  }
  return Math.floor(raw);
}

export function convertScenesFromLegendaIndex(
  scenes: SceneInput[],
  subtitles: Subtitle[],
): SceneWithFrames[] {
  if (subtitles.length === 0) return [];

  // Clamp each scene's startLeg up front, then enforce monotonic non-decreasing order so two
  // out-of-range hallucinations don't overlap when both clamp to the last subtitle.
  let prevStart = 0;
  const clamped = scenes.map((scene, i) => {
    let leg = clampStartLeg(scene.startLeg, scene.id, subtitles.length);
    if (i > 0 && leg < prevStart) leg = prevStart;
    prevStart = leg;
    return { ...scene, startLeg: leg };
  });

  return clamped.map((scene, index) => {
    const nextScene = clamped[index + 1];

    const startSubtitle = subtitles[scene.startLeg];
    const endSubtitle = nextScene
      ? subtitles[nextScene.startLeg]
      : subtitles[subtitles.length - 1];

    const startFrame = Math.round(startSubtitle.start * FPS);
    const endFrame = nextScene
      ? Math.round(endSubtitle.start * FPS)
      : Math.round(endSubtitle.end * FPS);

    return {
      ...scene,
      startFrame,
      endFrame,
      durationFrames: Math.max(endFrame - startFrame, 1),
    };
  });
}

export function calculateSceneDuration(
  startLeg: number,
  nextStartLeg: number | undefined,
  subtitles: Subtitle[],
): number {
  const startSub = subtitles[startLeg];
  const endSub = nextStartLeg !== undefined ? subtitles[nextStartLeg] : subtitles[subtitles.length - 1];

  if (!startSub || !endSub) return 0;

  return Math.round((endSub.start - startSub.start) * FPS);
}
