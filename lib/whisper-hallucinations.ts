import { Subtitle } from './types';

/**
 * Whisper has well-documented "hallucination" patterns: when fed silence, music, or
 * unintelligible audio it reproduces high-frequency strings from its training data —
 * almost always YouTube credit lines, "thanks for watching", legend signatures, etc.
 *
 * This list is curated from public reports + observed behavior on PT-BR + EN content.
 * Compared case-insensitively against subtitle text, after light normalization.
 */
const HALLUCINATION_PATTERNS: RegExp[] = [
  // Brazilian legend credits — extremely common
  /legendas?\s+por\s+/i,
  /legendado\s+por\s+/i,
  /tradu[çc][aã]o\s*[:\-]?\s*[a-z]/i,
  /sincroniza[çc][aã]o\s*[:\-]?/i,
  /revis[aã]o\s*[:\-]?\s*[a-z]/i,
  /TIAGO\s+ANDERSON/i,
  /amara\.org/i,

  // YouTube auto-generated outros / channel credits
  /thanks?\s+for\s+watching/i,
  /(please\s+)?subscribe(\s+to\s+(my|the)\s+channel)?/i,
  /like\s+and\s+subscribe/i,
  /see\s+you\s+(in\s+the\s+)?next\s+(video|one)/i,
  /don'?t\s+forget\s+to\s+(like|subscribe)/i,
  /obrigad[oa]\s+por\s+assistir/i,
  /se\s+inscrev[aei]\s+no\s+canal/i,
  /[ds]eixe\s+(o\s+)?like/i,

  // Pure punctuation / music markers
  /^[\s\.\,\?\!\-—…♪♫•·]+$/,
  /^[\s]*\(\s*m[uú]sica\s*\)\s*$/i,
  /^[\s]*\(\s*music\s*\)\s*$/i,
  /^[\s]*\[\s*aplausos?\s*\]\s*$/i,
];

/** Returns the matched pattern label if `text` looks like a Whisper hallucination. */
export function matchedHallucination(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  for (const re of HALLUCINATION_PATTERNS) {
    if (re.test(t)) return re.source;
  }
  return null;
}

export interface HallucinationCheck {
  /** True when we believe the transcription is mostly noise/hallucination. */
  isLikelyHallucination: boolean;
  /** Sample of matches found, for diagnostics. */
  matches: string[];
  /** Ratio of subtitles flagged as hallucination, 0..1. */
  ratio: number;
  /** Total spoken duration covered by subtitles, seconds. */
  totalSpeechSeconds: number;
}

/**
 * Analyze a subtitle list as a whole. We treat the transcription as a hallucination
 * when EITHER:
 *   (a) every subtitle matches a known hallucination pattern, OR
 *   (b) the only subtitles in the list are hallucinations and they cover < 30% of
 *       the video duration (i.e. tiny snippet of "fake" speech).
 *
 * `videoDuration` is the source video duration in seconds (optional but recommended).
 */
export function analyzeTranscription(
  subtitles: Subtitle[],
  videoDuration?: number,
): HallucinationCheck {
  if (subtitles.length === 0) {
    return { isLikelyHallucination: false, matches: [], ratio: 0, totalSpeechSeconds: 0 };
  }

  const matches: string[] = [];
  let halluCount = 0;
  let totalSpeech = 0;

  for (const s of subtitles) {
    totalSpeech += Math.max(0, s.end - s.start);
    const m = matchedHallucination(s.text);
    if (m) {
      halluCount++;
      if (matches.length < 5) matches.push(`"${s.text.slice(0, 80)}"`);
    }
  }

  const ratio = halluCount / subtitles.length;
  const speechRatio = videoDuration && videoDuration > 0 ? totalSpeech / videoDuration : 1;

  // (a) every subtitle is a known hallucination
  if (ratio === 1) return { isLikelyHallucination: true, matches, ratio, totalSpeechSeconds: totalSpeech };

  // (b) most are hallucinations AND speech is a tiny fraction of the video
  if (ratio >= 0.5 && speechRatio < 0.3) {
    return { isLikelyHallucination: true, matches, ratio, totalSpeechSeconds: totalSpeech };
  }

  return { isLikelyHallucination: false, matches, ratio, totalSpeechSeconds: totalSpeech };
}
