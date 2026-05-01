interface SubtitleData {
  index: number;
  text: string;
  start: number;
  end: number;
  words: any[];
}

const FPS = 30;

export function subtitleIndexToFrame(index: number, subtitles: SubtitleData[]): number {
  if (index >= subtitles.length) return subtitles.length * FPS;
  return Math.round(subtitles[index].start * FPS);
}

export function subtitleIndexToDurationFrames(
  startIndex: number,
  endIndex: number,
  subtitles: SubtitleData[]
): number {
  const startFrame = subtitleIndexToFrame(startIndex, subtitles);
  const endFrame = subtitleIndexToFrame(endIndex, subtitles);
  return Math.max(endFrame - startFrame, FPS); // min 1 second
}
