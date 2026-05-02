import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { Questionnaire, MusicStyle, MusicVolume } from './types';

export interface SoundtrackPick {
  /** Public URL path (relative, will be prefixed with internalUrl by caller). */
  src: string;
  /** Volume 0-1 when no speech is active. */
  baseVolume: number;
  /** Volume 0-1 when speech is active (ducked). */
  duckedVolume: number;
}

/**
 * Volume presets in linear amplitude (0-1). Values converted from dB:
 *   linear = 10^(dB/20)
 *
 * We want speech to dominate at all times. Even at the "high" preset the music
 * is held below conversational speech (~-6 dBFS reference) so subtitles/voice
 * stay intelligible on phone speakers.
 */
const VOLUME_PRESETS: Record<MusicVolume, { base: number; ducked: number }> = {
  low:    { base: 0.10, ducked: 0.04 }, // -20 dB / -28 dB
  medium: { base: 0.20, ducked: 0.08 }, // -14 dB / -22 dB
  high:   { base: 0.35, ducked: 0.14 }, // -9 dB / -17 dB
};

const VALID_STYLE_DIRS: MusicStyle[] = [
  'energetic', 'calm', 'epic', 'comic', 'melancholic', 'electronic',
];

const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.opus']);

/**
 * Pick a soundtrack file for this job based on the questionnaire.
 *
 * Returns null when:
 *  - questionnaire missing or music disabled
 *  - style is 'other' (we don't have a curated folder for it)
 *  - the style folder is empty or doesn't exist
 *
 * Selection is deterministic per jobId so re-renders pick the same track.
 */
export async function pickSoundtrack(
  questionnaire: Questionnaire | undefined,
  jobId: string,
): Promise<SoundtrackPick | null> {
  if (!questionnaire?.music?.enabled) return null;
  const style = questionnaire.music.style;
  if (!style || !VALID_STYLE_DIRS.includes(style as MusicStyle)) return null;

  const dir = path.join(process.cwd(), 'public', 'music', style);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }

  const audioFiles = entries
    .filter((f) => AUDIO_EXTS.has(path.extname(f).toLowerCase()))
    .sort(); // stable order so hash → file mapping is reproducible
  if (audioFiles.length === 0) return null;

  const hash = crypto.createHash('sha1').update(jobId).digest();
  const pickIdx = hash.readUInt32BE(0) % audioFiles.length;
  const file = audioFiles[pickIdx];

  const volumeKey: MusicVolume = (questionnaire.music.volume ?? 'medium') as MusicVolume;
  const preset = VOLUME_PRESETS[volumeKey] ?? VOLUME_PRESETS.medium;

  return {
    src: `/music/${style}/${encodeURIComponent(file)}`,
    baseVolume: preset.base,
    duckedVolume: preset.ducked,
  };
}
