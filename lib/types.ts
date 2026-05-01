export type SceneType = 'cover' | 'talking_head' | 'text_only' | 'callout' | 'split';
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'exciting';
export type JobStatus = 'uploading' | 'normalizing' | 'transcribing' | 'cutting-silence' | 'analyzing' | 'editing' | 'rendering' | 'done' | 'error';

export interface Word {
  word: string;
  start: number;
  end: number;
  sentiment?: Sentiment;
}

export interface Subtitle {
  index: number;
  text: string;
  start: number; // seconds
  end: number;
  words: Word[];
}

export interface SceneInput {
  id: string;
  type: SceneType;
  startLeg: number; // índice da legenda onde começa
  title: string;
  description: string;
  colorPalette: string[]; // array de 3 cores hex
  sentiment: Sentiment;
  imagePrompt?: string;
  imageUrl?: string;
  visualElements: string[];
  animationType?: string;
  pacing?: string;
}

export interface SceneWithFrames extends SceneInput {
  startFrame: number;
  endFrame: number;
  durationFrames: number;
}

export interface Analysis {
  format: string; // 'tutorial', 'storytelling', 'listicle', etc.
  colorPalette: [string, string, string];
  scenes: SceneInput[];
  accentColor: string;
  mood: string;
  summary: string;
  hook?: string;
}

export interface JobMetadata {
  id: string;
  status: JobStatus;
  prompt?: string;
  videoPath?: string;
  normalizedPath?: string;
  duration?: number;
  subtitles?: Subtitle[];
  /** Subtitles re-timed to the cut.mp4 timeline (silence removed). When present, this is what
   *  analyze, scenes-to-frames conversion, and render must use. */
  subtitlesCut?: Subtitle[];
  /** Path to the silence-cut MP4 (post normalize+cut). */
  cutPath?: string;
  /** Total seconds removed by the silence-cut step. */
  silenceCutSeconds?: number;
  analysis?: Analysis;
  outputPath?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  legendar?: boolean;
  animator?: boolean;
}

export interface PipelineStep {
  id: 'upload' | 'normalize' | 'transcribe' | 'analyze' | 'editing' | 'render';
  label: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
}
