#!/usr/bin/env bash
# Delete job directories older than RETAIN_DAYS (default 7).
# Safe to run from cron. Logs to stdout; redirect to a file if desired.
#
# Usage:
#   ./scripts/cleanup-old-jobs.sh
#   RETAIN_DAYS=3 JOBS_DIR=/custom/path ./scripts/cleanup-old-jobs.sh

set -euo pipefail

JOBS_DIR="${JOBS_DIR:-/data/jobs}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"

if [[ ! -d "$JOBS_DIR" ]]; then
  echo "[cleanup] JOBS_DIR=$JOBS_DIR not found, nothing to do."
  exit 0
fi

echo "[cleanup] scanning $JOBS_DIR (keeping last ${RETAIN_DAYS}d) — $(date -u +%Y-%m-%dT%H:%M:%SZ)"

deleted=0
freed=0

while IFS= read -r -d '' dir; do
  size_kb=$(du -sk "$dir" 2>/dev/null | cut -f1 || echo 0)
  rm -rf "$dir"
  freed=$(( freed + size_kb ))
  deleted=$(( deleted + 1 ))
  echo "[cleanup] removed $(basename "$dir") (${size_kb} KB)"
done < <(find "$JOBS_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+${RETAIN_DAYS}" -print0)

freed_mb=$(( freed / 1024 ))
echo "[cleanup] done — removed ${deleted} job(s), freed ~${freed_mb} MB"
