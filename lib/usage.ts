import type { TokenUsage, JobMetadata } from './types';

// ─── Pricing (USD, as of 2025) ────────────────────────────────────────────
// These are reference costs for estimates — actual invoices depend on which
// provider keys are configured. Update when provider pricing changes.

const PRICE = {
  whisperPerMinute:        0.006,   // OpenAI Whisper (Groq ≈ $0.002, blended ~$0.004)
  claudeInputPerMToken:    3.00,    // Claude Sonnet 4.x input
  claudeOutputPerMToken:   15.00,   // Claude Sonnet 4.x output
  imageGenPer1k:           80.00,   // gpt-image-1 standard quality (~$0.08 each)
  // BRL conversion — update monthly or via an env override
  usdToBrl:                parseFloat(process.env.USD_TO_BRL ?? '5.70'),
  // Markup to cover infra + profit (1.4 = 40% margin)
  markup:                  parseFloat(process.env.BILLING_MARKUP ?? '1.4'),
};

export function computeJobCost(usage: TokenUsage | undefined): number {
  if (!usage) return 0;
  let usd = 0;
  usd += (usage.whisperAudioMinutes ?? 0) * PRICE.whisperPerMinute;
  usd += ((usage.claudeInputTokens ?? 0) / 1_000_000) * PRICE.claudeInputPerMToken;
  usd += ((usage.claudeOutputTokens ?? 0) / 1_000_000) * PRICE.claudeOutputPerMToken;
  usd += ((usage.imageGenCount ?? 0) / 1_000) * PRICE.imageGenPer1k;
  return usd;
}

export function computeJobCostBRL(usage: TokenUsage | undefined): number {
  return computeJobCost(usage) * PRICE.usdToBrl * PRICE.markup;
}

export interface MonthlyUsage {
  month: string; // YYYY-MM
  jobCount: number;
  whisperAudioMinutes: number;
  claudeInputTokens: number;
  claudeOutputTokens: number;
  imageGenCount: number;
  rawCostUSD: number;
  billedCostBRL: number;
}

export interface UserUsageSummary {
  userId: string | null;
  totalJobs: number;
  monthly: MonthlyUsage[];
  /** Sum across all months. */
  totals: Omit<MonthlyUsage, 'month'>;
}

function jobMonth(job: JobMetadata): string {
  return job.createdAt.slice(0, 7); // YYYY-MM
}

export function aggregateUsage(jobs: JobMetadata[]): UserUsageSummary {
  const byMonth: Record<string, MonthlyUsage> = {};

  for (const job of jobs) {
    const m = jobMonth(job);
    if (!byMonth[m]) {
      byMonth[m] = {
        month: m,
        jobCount: 0,
        whisperAudioMinutes: 0,
        claudeInputTokens: 0,
        claudeOutputTokens: 0,
        imageGenCount: 0,
        rawCostUSD: 0,
        billedCostBRL: 0,
      };
    }
    const slot = byMonth[m];
    slot.jobCount++;
    slot.whisperAudioMinutes += job.tokenUsage?.whisperAudioMinutes ?? 0;
    slot.claudeInputTokens   += job.tokenUsage?.claudeInputTokens   ?? 0;
    slot.claudeOutputTokens  += job.tokenUsage?.claudeOutputTokens  ?? 0;
    slot.imageGenCount       += job.tokenUsage?.imageGenCount        ?? 0;
    slot.rawCostUSD          += computeJobCost(job.tokenUsage);
    slot.billedCostBRL       += computeJobCostBRL(job.tokenUsage);
  }

  const monthly = Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month));

  const totals: Omit<MonthlyUsage, 'month'> = {
    jobCount: 0,
    whisperAudioMinutes: 0,
    claudeInputTokens: 0,
    claudeOutputTokens: 0,
    imageGenCount: 0,
    rawCostUSD: 0,
    billedCostBRL: 0,
  };
  for (const m of monthly) {
    totals.jobCount            += m.jobCount;
    totals.whisperAudioMinutes += m.whisperAudioMinutes;
    totals.claudeInputTokens   += m.claudeInputTokens;
    totals.claudeOutputTokens  += m.claudeOutputTokens;
    totals.imageGenCount       += m.imageGenCount;
    totals.rawCostUSD          += m.rawCostUSD;
    totals.billedCostBRL       += m.billedCostBRL;
  }

  return {
    userId: jobs[0]?.userId ?? null,
    totalJobs: jobs.length,
    monthly,
    totals,
  };
}

/** Return jobs for the current calendar month. */
export function jobsThisMonth(jobs: JobMetadata[]): JobMetadata[] {
  const now = new Date().toISOString().slice(0, 7);
  return jobs.filter((j) => j.createdAt.startsWith(now));
}

export function formatUSD(usd: number): string {
  return `US$ ${usd.toFixed(4)}`;
}

export function formatBRL(brl: number): string {
  return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
