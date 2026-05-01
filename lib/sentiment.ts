/**
 * Tiny deterministic PT-BR lexicon for word-level sentiment coloring.
 *
 * NOT a real sentiment classifier. The goal is purely visual: when a positive-loaded word like
 * "vitória" or a negative-loaded word like "problema" hits the screen, color it differently so
 * the captions feel alive. Anything we don't know is `neutral`. False positives/negatives here
 * are cosmetic, not semantic.
 *
 * Lists are stored already normalized (lowercase, no diacritics) so we only normalize the input
 * once at lookup time.
 */

type Lexicon = ReadonlySet<string>;

const POSITIVE_RAW: readonly string[] = [
  // Conquista / sucesso
  'conquista', 'conquistar', 'conquistei', 'conquistou',
  'sucesso', 'vitoria', 'vitorias', 'triunfo',
  'incrivel', 'incriveis', 'genial', 'genio',
  'perfeito', 'perfeita', 'impecavel', 'impecaveis',
  'sensacional', 'espetacular', 'extraordinario', 'extraordinaria',
  'excelente', 'excelentes', 'otimo', 'otima', 'otimos', 'otimas',
  'maravilhoso', 'maravilhosa', 'fantastico', 'fantastica', 'fantasticos',
  'bom', 'boa', 'bons', 'boas', 'melhor', 'melhores',
  'top', 'show', 'massa', 'demais',
  // Emoção positiva
  'amor', 'amo', 'adoro', 'adorei', 'feliz', 'felicidade',
  'alegria', 'alegre', 'paixao', 'apaixonado',
  // Resultado / progresso
  'crescer', 'crescimento', 'crescendo', 'cresci',
  'ganhar', 'ganho', 'ganhei', 'ganhou', 'ganhamos',
  'lucro', 'lucros', 'lucrar', 'rendeu',
  'resultado', 'resultados', 'aprovado', 'aprovada',
  'consegue', 'consegui', 'conseguiu', 'conseguimos',
  'aumentar', 'aumento', 'aumentou', 'dobrou', 'triplicou',
  'liberdade', 'livre', 'libertacao',
  // Resposta positiva
  'sim', 'claro', 'certeza', 'pode',
  // Velocidade / facilidade
  'facil', 'faceis', 'rapido', 'rapida', 'rapidos', 'simples',
  // Dinheiro / abundancia
  'rico', 'riqueza', 'milhao', 'milhoes', 'milionario',
  // Saúde / força
  'forte', 'fortes', 'poderoso', 'poderosa', 'energia',
];

const NEGATIVE_RAW: readonly string[] = [
  // Problema / falha
  'problema', 'problemas', 'erro', 'erros',
  'falha', 'falhas', 'falhar', 'falhou', 'fracasso', 'fracassos',
  'bug', 'bugs', 'travar', 'travou', 'parar', 'parou',
  // Dificuldade / impossibilidade
  'dificil', 'dificeis', 'impossivel', 'impossiveis',
  'complicado', 'complicada', 'complexo',
  // Qualidade ruim
  'ruim', 'ruins', 'pessimo', 'pessima', 'horrivel', 'horriveis',
  'terrivel', 'terriveis', 'pior', 'piores',
  // Custo / falta
  'caro', 'cara', 'caros', 'caras', 'gasto', 'gastos',
  'pobreza', 'pobre', 'pobres', 'falido',
  'prejuizo', 'prejuizos', 'perda', 'perdas',
  'perder', 'perdi', 'perdeu', 'perdemos',
  // Crise / risco
  'crise', 'crises', 'risco', 'riscos', 'perigo', 'perigos',
  'medo', 'medos', 'ansiedade', 'panico',
  // Dor / sofrimento
  'dor', 'dores', 'sofrer', 'sofrendo', 'sofrimento',
  'morte', 'morrer', 'morreu',
  // Cansaço / estresse
  'cansaco', 'cansado', 'cansada', 'cansei',
  'estresse', 'estressado', 'estressada',
  'burnout', 'esgotado', 'exausto',
  // Negação / refutação
  'nao', 'nunca', 'jamais', 'nada',
  // Aversão
  'odeio', 'odiar', 'odiou', 'detesto', 'detesta',
  // Engano
  'mentira', 'mentir', 'fake', 'falso', 'falsa', 'golpe',
];

const POSITIVE: Lexicon = new Set(POSITIVE_RAW);
const NEGATIVE: Lexicon = new Set(NEGATIVE_RAW);

/**
 * Normalize a word for lookup: lowercase, strip surrounding punctuation, drop diacritics.
 * Idempotent.
 */
export function normalizeWord(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ''); // strip punctuation; keeps alphanum across PT after diacritic removal
}

export type WordSentiment = 'positive' | 'negative' | 'neutral';

export function classify(word: string): WordSentiment {
  const w = normalizeWord(word);
  if (!w) return 'neutral';
  if (POSITIVE.has(w)) return 'positive';
  if (NEGATIVE.has(w)) return 'negative';
  return 'neutral';
}
