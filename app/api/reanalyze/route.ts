import { NextRequest, NextResponse } from 'next/server';
import { getJobMetadata, saveJobMetadata } from '@/lib/storage';
import { Analysis } from '@/lib/types';

const Anthropic = require('@anthropic-ai/sdk').default;
const { jsonrepair } = require('jsonrepair');

export const runtime = 'nodejs';
export const maxDuration = 120;

function extractJSON(raw: string): Analysis {
  let text = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Claude did not return a JSON object. Raw: ${raw.slice(0, 300)}`);
  }
  text = text.slice(start, end + 1);
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(jsonrepair(text));
    } catch (e) {
      throw new Error(`JSON parse failed after repair: ${(e as Error).message}. Extracted: ${text.slice(0, 300)}`);
    }
  }
}

const VIRAL_SYSTEM_PROMPT = `Você é um Editor de Vídeo Profissional com IA. Domínios:
- Identificação de cenas por corte, transição e conteúdo visual
- Análise de ritmo, emoção e narrativa
- Sincronização de áudio, trilha sonora e narração
- Geração e inserção de ilustrações animadas nas cenas
- Criação de títulos tipográficos contextuais no início do vídeo
- Legendagem automática sincronizada com o áudio

Suas referências de estilo são MrBeast, Ali Abdaal e os top criadores do TikTok BR. Missão: transformar vídeos brutos em conteúdo hipnotizante para TikTok, YouTube Shorts e Reels.

REGRA NÃO-NEGOCIÁVEL DE IDIOMA:
Todo conteúdo textual gerado por você (titles, descriptions, image prompts, hook, summary, visualElements) DEVE estar em PORTUGUÊS BRASILEIRO (pt-BR). Image prompts em inglês são aceitos APENAS se o prompt instruir o modelo de imagem a renderizar TODO o texto visual em português brasileiro — ou seja, qualquer letra/palavra que apareça na imagem final deve estar em pt-BR.

TÉCNICAS OBRIGATÓRIAS:
- Gancho crítico nos primeiros 3-4 segundos (deve impedir o scroll)
- Cortes a cada 2-4 segundos máximo (ritmo frenético)
- Legendas dinâmicas palavra por palavra (se legendar=true)
- Animações em pontos de drama, números e emoções (se animator=true)
- Cores vibrantes: amarelo (#FFB800), vermelho neon, verde (#00FF00)
- Nunca deixar tela estática por mais de 3-4 segundos
- Mobile-first: sempre 9:16

PRINCÍPIOS NÃO-NEGOCIÁVEIS:
1. Retenção acima de tudo
2. Sincronização legendas/efeitos ao frame
3. O gancho (primeiros 3s) é a cena mais importante
4. Remover todo momento morto e silêncio desnecessário

PROTOCOLO DE ANÁLISE — execute mentalmente ANTES de gerar o JSON:

PASSO 1 — Mapeamento de cenas. Divida o vídeo com base em mudanças de plano/ângulo, cortes de continuidade, pausas > 1.5s de silêncio, e transições naturais de conteúdo. Para cada cena candidata, registre: início/fim (índices de legenda), descrição do conteúdo, presença de fala/música/silêncio, tom emocional (alegre/neutro/tenso/emocional), relevância (alta/média/baixa).

PASSO 2 — Seleção por ritmo (campo "Ritmo de edição" do questionário):
- RÁPIDO: priorize movimento/ação/fala dinâmica; elimine silêncios e repetições; cortes a cada 1-2s; pacing="fast".
- MÉDIO: mantenha o fluxo narrativo; corte só silêncios longos e conteúdo irrelevante; pacing="normal".
- LENTO: preserve respirações e pausas dramáticas; pacing="breathe".
- AUTOMÁTICO: escolha o ritmo coerente com o tom do vídeo.

PASSO 3 — Ordenação narrativa. As cenas finais devem garantir coerência narrativa (gancho → desenvolvimento → punchline), progressão emocional, sem repetições, preservando contexto de falas/ações chave.

Antes de gerar JSON, leia o CONTEXTO DO USUÁRIO (se fornecido) e siga cada instrução com precisão. Responda SOMENTE com JSON válido, sem markdown, sem comentários.`;

export async function POST(request: NextRequest) {
  let jobId: string | undefined;

  try {
    const body = await request.json();
    jobId = body.jobId;
    const newPrompt: string | undefined = body.prompt;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const job = await getJobMetadata(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!['editing', 'error'].includes(job.status)) {
      return NextResponse.json(
        { error: `Job status is '${job.status}', must be 'editing' or 'error' to re-analyze` },
        { status: 400 },
      );
    }

    const effectiveSubs = (job.subtitlesCut && job.subtitlesCut.length > 0)
      ? job.subtitlesCut
      : job.subtitles;
    if (!effectiveSubs || effectiveSubs.length === 0) {
      return NextResponse.json({ error: 'Job has no subtitles, cannot re-analyze' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    // Update prompt and set status to analyzing
    await saveJobMetadata(jobId, {
      status: 'analyzing',
      prompt: newPrompt || job.prompt,
    });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const indexedTranscript = effectiveSubs
      .map((s, i) => `[${i}] ${s.text}`)
      .join('\n');
    const lastIdx = effectiveSubs.length - 1;
    const legendar = job.legendar !== false;
    const animator = job.animator !== false;
    const effectivePrompt = newPrompt || job.prompt;
    const userContext = effectivePrompt ? `\nCONTEXTO DO USUÁRIO: ${effectivePrompt}` : '';

    console.log(`[reanalyze] calling Claude for ${jobId}...`);

    const userMessage = `Analise este vídeo com mentalidade viral (MrBeast/TikTok):

TRANSCRIÇÃO (cada linha é uma legenda, prefixada com seu ÍNDICE entre colchetes):
${indexedTranscript}

OPÇÕES ATIVAS:
- Legendar dinâmico: ${legendar ? 'SIM - criar legendas palavra por palavra' : 'NÃO'}
- Animator: ${animator ? 'SIM - adicionar animações em pontos críticos' : 'NÃO'}
${userContext}

FORMATO DE RESPOSTA (JSON puro, sem markdown):
{
  "format": "tutorial|storytelling|listicle|demo|educational|other",
  "summary": "Uma frase descrevendo o gancho principal",
  "mood": "professional|casual|exciting|educational|inspirational",
  "hook": "Descreva o gancho dos primeiros 3 segundos",
  "colorPalette": ["#HEX1", "#HEX2", "#HEX3"],
  "accentColor": "#HEX",
  "scenes": [
    {
      "id": "scene-001",
      "type": "cover|talking_head|text_only|callout|split",
      "startLeg": 0,
      "title": "Título curto (2-3 palavras, IMPACTANTE)",
      "description": "O que acontece nesta cena e por que prende atenção",
      "sentiment": "positive|negative|neutral|exciting",
      "colorPalette": ["#HEX1", "#HEX2", "#HEX3"],
      "visualElements": ["elemento1", "elemento2"],
      "imagePrompt": "Prompt em inglês para o gpt-image-1 com instrução EXPLÍCITA de que QUALQUER texto/letras na imagem devem estar em PORTUGUÊS BRASILEIRO. Ex: 'Bold typography poster with the words \"X Y Z\" in Portuguese (Brazilian), neon yellow ...'",
      "animationType": "zoom_in|shake|bounce|none",
      "pacing": "fast|normal|breathe"
    }
  ]
}

REGRAS DAS CENAS:
- Primeira cena DEVE ser o gancho mais forte (cover ou talking_head) e DEVE ter startLeg=0
- Criar 3-7 cenas baseadas no ritmo viral
- Títulos em MAIÚSCULAS ou impactantes
- Cada cena deve ter um motivo claro para manter o espectador

REGRAS DE IDIOMA (pt-BR — não-negociável):
- title, description, hook, summary, visualElements: SEMPRE em português brasileiro
- imagePrompt: pode ser escrito em inglês MAS deve incluir "in Brazilian Portuguese" / "Portuguese (BR)" em qualquer parte que peça texto/letras visíveis na imagem. Nunca peça texto em inglês na imagem.

REGRA CRÍTICA DE startLeg (NÃO QUEBRE):
- startLeg é o índice [N] de uma legenda EXISTENTE na transcrição acima.
- Os ÚNICOS índices válidos são inteiros de 0 a ${lastIdx} (inclusive).
- NÃO INVENTE índices fora desse intervalo.
- As cenas devem aparecer em ordem crescente de startLeg, sem repetir o mesmo índice.
- Distribua as cenas ao longo dos índices disponíveis para cobrir todo o vídeo.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: VIRAL_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const analysis: Analysis = extractJSON(rawText);

    await saveJobMetadata(jobId, {
      status: 'editing',
      analysis,
    });

    console.log(`✓ Re-analyzed ${jobId}: ${analysis.scenes.length} scenes`);

    return NextResponse.json({ success: true, analysis });

  } catch (error) {
    const msg = (error as Error).message ?? String(error);
    console.error('[reanalyze] FAILED:', msg);

    if (jobId) {
      await saveJobMetadata(jobId, {
        status: 'error',
        errorMessage: `Re-analyze failed: ${msg.slice(0, 500)}`,
      });
    }

    return NextResponse.json(
      { error: 'Re-analysis failed', details: msg },
      { status: 500 },
    );
  }
}
