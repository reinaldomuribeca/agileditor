import fs from 'fs/promises';
import path from 'path';
import { JobMetadata } from './types';

/**
 * Where job artifacts live. In production this MUST be a persistent volume mount
 * (e.g. /var/agil-editor/jobs on the VPS, or /app/data/jobs inside the container).
 * The default `data/jobs` is repo-relative so dev works without env, but the data/
 * folder is gitignored.
 */
const JOBS_DIR = process.env.JOBS_DIR
  ? path.resolve(process.env.JOBS_DIR)
  : path.resolve(process.cwd(), 'data', 'jobs');

export const JOBS_ROOT = JOBS_DIR;

export async function ensureJobDir(jobId: string): Promise<string> {
  const jobDir = path.join(JOBS_DIR, jobId);
  await fs.mkdir(jobDir, { recursive: true });
  return jobDir;
}

export async function saveJobMetadata(jobId: string, metadata: Partial<JobMetadata>): Promise<void> {
  const jobDir = await ensureJobDir(jobId);
  const metadataPath = path.join(jobDir, 'metadata.json');
  
  let existing: JobMetadata = {
    id: jobId,
    status: 'uploading',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  try {
    const data = await fs.readFile(metadataPath, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }
  
  const updated = {
    ...existing,
    ...metadata,
    updatedAt: new Date().toISOString(),
  };
  
  await fs.writeFile(metadataPath, JSON.stringify(updated, null, 2));
}

export async function getJobMetadata(jobId: string): Promise<JobMetadata | null> {
  try {
    const jobDir = path.join(JOBS_DIR, jobId);
    const metadataPath = path.join(jobDir, 'metadata.json');
    const data = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function getJobFilePath(jobId: string, filename: string): Promise<string> {
  return path.join(JOBS_DIR, jobId, filename);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
