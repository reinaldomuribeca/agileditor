export interface WordData {
  word: string;
  start: number;
  end: number;
  sentiment?: string;
}

export interface SubtitleData {
  index: number;
  text: string;
  start: number;
  end: number;
  words: WordData[];
}

export interface SceneData {
  id: string;
  type: string;
  startLeg: number;
  title: string;
  description: string;
  colorPalette: string[];
  sentiment: string;
  visualElements: string[];
  imageUrl?: string;
  animationType?: string;
  pacing?: string;
}

export interface CompositionProps {
  scenes: (SceneData & { startFrame: number; endFrame: number; durationFrames: number })[];
  subtitles: SubtitleData[];
  videoSrc?: string;
}
