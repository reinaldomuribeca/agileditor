export type SceneType = 'cover' | 'talking_head' | 'text_only' | 'callout' | 'split' | 'intro';
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'exciting';
export type JobStatus = 'uploading' | 'normalizing' | 'transcribing' | 'cutting-silence' | 'analyzing' | 'editing' | 'rendering' | 'done' | 'error';

/**
 * Cut mode — how the video should be trimmed during the cut-silence step.
 *
 * - `none`     : do not cut; keep the full normalized video
 * - `speech`   : cut audio gaps (silences) between subtitle ranges
 * - `scene`    : cut visually-static segments (where no scene change is detected)
 * - `ai`       : Claude reads the transcript and picks the best segments to keep
 */
export type CutMode = 'none' | 'speech' | 'scene' | 'ai';

/**
 * How aggressive the cut should be. Maps to gap thresholds (speech) or
 * scene-change thresholds (scene). Ignored for `none` and `ai`.
 */
export type CutAggressiveness = 'subtle' | 'balanced' | 'aggressive';

/**
 * Pre-upload questionnaire — 8 questions the user fills before submitting a video.
 * Every answer should propagate into the AI prompts (analyze + image gen) and the
 * render pipeline, not just be stored.
 */
export type ContentType = 'humor' | 'serious' | 'emotional' | 'educational' | 'documentary' | 'vlog' | 'commercial' | 'other';
export type EditingPace = 'fast' | 'medium' | 'slow' | 'auto';
export type MusicStyle = 'energetic' | 'calm' | 'epic' | 'comic' | 'melancholic' | 'electronic' | 'other';
export type MusicVolume = 'low' | 'medium' | 'high';
export type SubtitleStyle = 'standard' | 'animated' | 'none';
export type IllustrationStyle = 'minimal' | 'cartoon' | 'arrows' | 'infographic' | 'comic';
export type TransitionStyle = 'none' | 'fade-soft' | 'fade-fast' | 'zoom' | 'slide' | 'auto';

export interface Questionnaire {
  contentType: ContentType;
  contentTypeOther?: string;
  pace: EditingPace;
  music: {
    enabled: boolean;
    style?: MusicStyle;
    styleOther?: string;
    volume?: MusicVolume;
  };
  subtitles: SubtitleStyle;
  illustrations: {
    enabled: boolean;
    style?: IllustrationStyle;
  };
  introTitle: {
    enabled: boolean;
    title?: string;
    subtitle?: string;
  };
  transition: TransitionStyle;
  /** Free-form notes (Question 8). */
  notes?: string;
}

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
  /** For type='intro' only: subtitle text shown below the title. */
  subtitle?: string;
  /** For type='intro' only: which font/animation preset to use (mirrors questionnaire.contentType). */
  contentType?: ContentType;
  /** For type='intro' only: pre-computed flag — true when first frame of source is light. */
  isLightBg?: boolean;
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
  /** Cut strategy chosen by the user at upload time. Defaults to 'speech' on legacy jobs. */
  cutMode?: CutMode;
  /** Cut intensity (only relevant for 'speech' and 'scene'). Defaults to 'balanced'. */
  cutAggressiveness?: CutAggressiveness;
  /** Pre-upload questionnaire snapshot. */
  questionnaire?: Questionnaire;
  /** Soft warnings the pipeline produced (e.g. detected hallucination, fallback applied). */
  warnings?: string[];
  /** Average luminance of the first frame (0-255). Used for intro title auto-contrast. */
  firstFrameLuminance?: number;
}

export interface PipelineStep {
  id: 'upload' | 'normalize' | 'transcribe' | 'analyze' | 'editing' | 'render';
  label: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
}
