import type { ContentType } from './types';

export interface IntroStyleDescriptor {
  fontName: string;
  animationName: string;
  /** Short human-friendly description suitable for the report panel. */
  description: string;
}

const TABLE: Record<ContentType, IntroStyleDescriptor> = {
  humor:       { fontName: 'Fredoka',           animationName: 'Bounce',                    description: 'fonte arredondada com salto animado' },
  serious:     { fontName: 'Playfair Display',  animationName: 'Fade-in com subida',        description: 'fonte serifada elegante com fade suave' },
  documentary: { fontName: 'Playfair Display',  animationName: 'Fade-in com subida',        description: 'fonte serifada com presença documental' },
  emotional:   { fontName: 'Lora',              animationName: 'Fade lento + escala',       description: 'fonte com personalidade, crescimento gradual' },
  educational: { fontName: 'Inter',             animationName: 'Fade + linha sublinhada',   description: 'fonte limpa com sublinhado animado' },
  vlog:        { fontName: 'Caveat',            animationName: 'Typewriter',                description: 'fonte manuscrita com escrita progressiva' },
  commercial:  { fontName: 'Anton',             animationName: 'Flash + zoom',              description: 'fonte de impacto com flash e zoom punchy' },
  other:       { fontName: 'Sora',              animationName: 'Fade-in com subida',        description: 'fonte default do app' },
};

export function describeIntroStyle(ct: ContentType | undefined): IntroStyleDescriptor {
  return TABLE[ct ?? 'other'] ?? TABLE.other;
}
