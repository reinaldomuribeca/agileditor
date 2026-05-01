import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { JOBS_ROOT } from '@/lib/storage';

export const runtime = 'nodejs';

const JOBS_DIR = JOBS_ROOT;

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string; path: string[] } },
) {
  const { jobId, path: pathSegments } = params;

  // Sanitize jobId — alphanumeric and hyphens only
  if (!/^[a-f0-9-]+$/i.test(jobId)) {
    return new Response('Invalid jobId', { status: 400 });
  }

  // Build file path and prevent traversal
  const fileName = pathSegments.join('/');
  const jobDir   = path.join(JOBS_DIR, jobId);
  const filePath = path.resolve(jobDir, fileName);

  if (!filePath.startsWith(jobDir + path.sep) && filePath !== jobDir) {
    return new Response('Forbidden', { status: 403 });
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return new Response('File not found', { status: 404 });
  }

  const fileSize = stat.size;
  const range    = request.headers.get('range');

  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.mp4'  ? 'video/mp4'
                    : ext === '.mp3'  ? 'audio/mpeg'
                    : ext === '.json' ? 'application/json'
                    : ext === '.png'  ? 'image/png'
                    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
                    : ext === '.webp' ? 'image/webp'
                    : 'application/octet-stream';

  const baseHeaders: Record<string, string> = {
    'Content-Type':  contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  };

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start     = parseInt(startStr, 10);
    const end       = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const nodeStream = fs.createReadStream(filePath, { start, end });
    return new Response(nodeReadStreamToWeb(nodeStream), {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': String(chunkSize),
      },
    });
  }

  const nodeStream = fs.createReadStream(filePath);
  return new Response(nodeReadStreamToWeb(nodeStream), {
    status: 200,
    headers: {
      ...baseHeaders,
      'Content-Length': String(fileSize),
    },
  });
}

function nodeReadStreamToWeb(nodeStream: fs.ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: string | Buffer) => {
        controller.enqueue(new Uint8Array(typeof chunk === 'string' ? Buffer.from(chunk) : chunk));
      });
      nodeStream.on('end',   () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
    cancel() { nodeStream.destroy(); },
  });
}
