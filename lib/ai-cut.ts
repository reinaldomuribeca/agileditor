import { Subtitle } from './types';
import { KeepSegment } from './silence';

const Anthropic = require('@anthropic-ai/sdk').default;
const { jsonrepair } = require('jsonrepair');

const SYSTEM_PROMPT = `Você é um editor de vídeo profissional especializado em conteúdo viral curto (TikTok, Reels, Shorts).

Sua tarefa: ler a transcrição com timestamps de um vídeo e decidir QUAIS TRECHOS manter no corte final.

CRITÉRIOS DE CORTE (cortar = remover do vídeo):
- Muletas verbais: "tipo", "né", "então", "uhm", "ahn", "é..."
- Repetições e frases reiniciadas / abandonadas
- Pausas longas entre ideias
- Aberturas mornas ("oi gente, tudo bem?", "então pessoal...") quando há gancho melhor depois
- Despedidas longas que matam o ritmo

CRITÉRIOS DE MANTER (não cortar):
- O melhor gancho dos primeiros 5–8s — promessa, pergunta polêmica, número, fato curioso
- Trechos com emoção ou ênfase ("INCRÍVEL", "vou te contar uma coisa")
- Conclusões/punchlines no final
- Qualquer dado concreto (números, nomes, datas)

REGRAS DE SAÍDA:
- O resultado final deve ter entre 50% e 90% da duração original (nunca cortar mais que metade).
- Os trechos devem ser CONTÍGUOS dentro de cada keep-segment (não pular palavras no meio de uma frase coerente).
- Junte trechos consecutivos em um único keep-segment quando o conteúdo flui.
- Devolva APENAS JSON válido, sem comentários, sem markdown.

FORMATO DE RESPOSTA:
{
  "keepSegments": [
    { "start": 0.0, "end": 4.8, "reason": "gancho — promessa de revelação" },
    { "start": 7.2, "end": 18.5, "reason": "explicação principal com dado concreto" }
  ]
}`;

export interface AICutOptions {
  /** Source duration in seconds. */
  totalDuration: number;
  /** Optional user-provided context (the prompt entered at upload time). */
  prompt?: string;
}

export interface AICutResult {
  segments: KeepSegment[];
  reasons: string[];
  rawResponse: string;
}

/**
 * Format subtitles for Claude. We keep word-level timing implicit and just give
 * Claude segment-level timestamps — that's the resolution it needs to make cut decisions.
 */
function formatTranscript(subtitles: Subtitle[]): string {
  return subtitles
    .map((s) => `[${s.index}] start=${s.start.toFixed(2)}s end=${s.end.toFixed(2)}s: "${s.text.replace(/"/g, '\\"')}"`)
    .join('\n');
}

function extractJSON(raw: string): { keepSegments: { start: number; end: number; reason?: string }[] } {
  let text = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`AI cut: no JSON object in response. Raw: ${raw.slice(0, 300)}`);
  }
  text = text.slice(start, end + 1);
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(jsonrepair(text));
  }
}

/**
 * Call Claude to decide which segments to keep. Returns keep-segments compatible
 * with the same `shiftSubtitles` / ffmpeg-cut pipeline used by the silence-cut path.
 */
export async function aiCutKeepSegments(
  subtitles: Subtitle[],
  options: AICutOptions,
): Promise<AICutResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set — required for AI cut mode');
  }
  if (subtitles.length === 0) {
    return { segments: [{ start: 0, end: options.totalDuration, cumulativeRemoved: 0 }], reasons: [], rawResponse: '' };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const transcriptBlock = formatTranscript(subtitles);
  const userPrompt = [
    options.prompt
      ? `Contexto do criador: ${options.prompt}\n`
      : '',
    `Duração total do vídeo: ${options.totalDuration.toFixed(2)}s`,
    `Transcrição (cada linha é uma fala com timestamps absolutos):`,
    '',
    transcriptBlock,
    '',
    'Devolva o JSON com os keep-segments agora.',
  ].filter(Boolean).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const rawResponse = response.content
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { type: string; text: string }) => b.text)
    .join('\n');

  const parsed = extractJSON(rawResponse);
  const raw = parsed.keepSegments ?? [];

  // Sanitize: clamp, sort, drop invalid, merge tiny gaps.
  const cleaned = raw
    .map((s) => ({
      start: Math.max(0, Math.min(options.totalDuration, Number(s.start) || 0)),
      end: Math.max(0, Math.min(options.totalDuration, Number(s.end) || 0)),
      reason: s.reason ?? '',
    }))
    .filter((s) => s.end > s.start + 0.1) // drop sub-100ms slivers
    .sort((a, b) => a.start - b.start);

  // Merge overlapping or near-touching segments (< 0.3s gap).
  const merged: { start: number; end: number; reason: string }[] = [];
  for (const s of cleaned) {
    const last = merged[merged.length - 1];
    if (last && s.start - last.end < 0.3) {
      last.end = Math.max(last.end, s.end);
      if (s.reason && !last.reason.includes(s.reason)) {
        last.reason = `${last.reason}; ${s.reason}`;
      }
    } else {
      merged.push({ ...s });
    }
  }

  // Sanity: total kept must be at least 30% of original. Otherwise fall back to keeping all.
  const kept = merged.reduce((acc, s) => acc + (s.end - s.start), 0);
  if (kept / options.totalDuration < 0.3) {
    return {
      segments: [{ start: 0, end: options.totalDuration, cumulativeRemoved: 0 }],
      reasons: [`AI cut would remove >70% (${kept.toFixed(1)}s of ${options.totalDuration.toFixed(1)}s) — keeping full video`],
      rawResponse,
    };
  }

  // Convert to KeepSegment[] with cumulativeRemoved.
  const out: KeepSegment[] = [];
  let cursor = 0;
  let removed = 0;
  for (const s of merged) {
    if (s.start > cursor) removed += s.start - cursor;
    out.push({ start: s.start, end: s.end, cumulativeRemoved: removed });
    cursor = s.end;
  }

  return { segments: out, reasons: merged.map((s) => s.reason).filter(Boolean), rawResponse };
}
