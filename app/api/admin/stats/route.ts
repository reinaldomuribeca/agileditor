import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { JOBS_ROOT } from '@/lib/storage';
import { listUsers } from '@/lib/users';
import { aggregateUsage, jobsThisMonth, computeJobCost, computeJobCostBRL } from '@/lib/usage';
import type { JobMetadata } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadAllJobs(): Promise<JobMetadata[]> {
  const entries = await fs.readdir(JOBS_ROOT).catch(() => [] as string[]);
  const jobs = await Promise.all(
    entries.map(async (jobId) => {
      try {
        const raw = await fs.readFile(path.join(JOBS_ROOT, jobId, 'metadata.json'), 'utf-8');
        return JSON.parse(raw) as JobMetadata;
      } catch {
        return null;
      }
    }),
  );
  return jobs.filter(Boolean) as JobMetadata[];
}

export async function GET() {
  try {
    const [allJobs, users] = await Promise.all([loadAllJobs(), listUsers()]);

    const thisMonth = jobsThisMonth(allJobs);

    // Per-user job map
    const jobsByUser: Record<string, JobMetadata[]> = {};
    for (const job of allJobs) {
      const uid = job.userId ?? '__unassigned__';
      (jobsByUser[uid] ??= []).push(job);
    }

    const userStats = users.map((u) => {
      const userJobs = jobsByUser[u.id] ?? [];
      const monthJobs = jobsThisMonth(userJobs);
      const usage = aggregateUsage(userJobs);
      const monthUsage = aggregateUsage(monthJobs.length > 0 ? monthJobs : []);
      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        status: u.status,
        totalJobs: userJobs.length,
        jobsThisMonth: monthJobs.length,
        totalCostUSD: usage.totals.rawCostUSD,
        totalCostBRL: usage.totals.billedCostBRL,
        monthCostUSD: monthUsage.totals.rawCostUSD,
        monthCostBRL: monthUsage.totals.billedCostBRL,
        lastJobAt: userJobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt ?? null,
      };
    });

    // Global aggregates
    const totalCostUSD = allJobs.reduce((s, j) => s + computeJobCost(j.tokenUsage), 0);
    const totalCostBRL = allJobs.reduce((s, j) => s + computeJobCostBRL(j.tokenUsage), 0);
    const monthCostUSD = thisMonth.reduce((s, j) => s + computeJobCost(j.tokenUsage), 0);
    const monthCostBRL = thisMonth.reduce((s, j) => s + computeJobCostBRL(j.tokenUsage), 0);

    // Jobs by status this month
    const statusCounts: Record<string, number> = {};
    for (const j of thisMonth) {
      statusCounts[j.status] = (statusCounts[j.status] ?? 0) + 1;
    }

    return NextResponse.json({
      overview: {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === 'active').length,
        totalJobs: allJobs.length,
        jobsThisMonth: thisMonth.length,
        totalCostUSD,
        totalCostBRL,
        monthCostUSD,
        monthCostBRL,
        statusCounts,
      },
      userStats,
      recentJobs: allJobs
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 20)
        .map((j) => ({
          id: j.id,
          userId: j.userId ?? null,
          status: j.status,
          duration: j.duration,
          createdAt: j.createdAt,
          updatedAt: j.updatedAt,
          costUSD: computeJobCost(j.tokenUsage),
          tokenUsage: j.tokenUsage,
        })),
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
