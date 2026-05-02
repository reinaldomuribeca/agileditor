# ── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

# Chromium (Remotion) + FFmpeg runtime deps for Debian Bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libglib2.0-0 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libfreetype6 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcairo-gobject2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxtst6 \
    libdrm2 \
    libgbm1 \
    libgl1-mesa-dri \
    libglu1-mesa \
    libcups2 \
    && (apt-get install -y --no-install-recommends libasound2t64 || apt-get install -y --no-install-recommends libasound2) \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: builder ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# cache-bust: v2-landing-page
ARG CACHEBUST=1
RUN echo "build $CACHEBUST"

RUN npm run build

# Install Remotion subproject deps + pre-bundle (best-effort)
RUN cd remotion && npm ci && npm run build 2>/dev/null || true

# ── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Where Remotion stores its downloaded Chromium build. We pre-fetch it below
# under this path so the runtime user does not need to (and cannot) write here.
ENV REMOTION_BROWSER_CACHE=/opt/remotion-browser

# Same Chromium/FFmpeg runtime libs as deps stage
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libglib2.0-0 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libfreetype6 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libcairo-gobject2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxtst6 \
    libdrm2 \
    libgbm1 \
    libgl1-mesa-dri \
    libglu1-mesa \
    libcups2 \
    && (apt-get install -y --no-install-recommends libasound2t64 || apt-get install -y --no-install-recommends libasound2) \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Production node_modules from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Built Next.js app
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.* ./

# Remotion subproject with its own node_modules + pre-built bundle.
# Wipe webpack cache from build stage so runtime user starts clean and can
# write/delete inside .cache/webpack without EACCES.
COPY --from=builder --chown=nextjs:nodejs /app/remotion ./remotion
RUN rm -rf /app/remotion/node_modules/.cache && \
    mkdir -p /app/remotion/node_modules/.cache && \
    chown -R nextjs:nodejs /app/remotion

# Pre-download the Chromium build that @remotion/renderer needs into a path
# the non-root user can read. Without this, Remotion tries to download
# Chromium at first render — and fails on EACCES (mkdir) because the runtime
# user can't write into /home/nextjs from a non-shell process tree.
#
# We try several methods because the API differs between Remotion versions:
#   1. CLI:     `npx remotion browser ensure`  (4.0.x stable)
#   2. JS API:  ensureBrowser()
# If both fail, we still create the dir (writable by the runtime user) so
# Remotion can fall back to downloading at first run.
RUN mkdir -p ${REMOTION_BROWSER_CACHE} && \
    cd /app/remotion && \
    ( REMOTION_BROWSER_CACHE=${REMOTION_BROWSER_CACHE} npx --yes remotion browser ensure 2>&1 || \
      REMOTION_BROWSER_CACHE=${REMOTION_BROWSER_CACHE} node -e "require('@remotion/renderer').ensureBrowser().then(()=>console.log('chromium ready via JS API')).catch(e=>{console.error('JS API failed:', e.message);process.exit(1)})" 2>&1 || \
      echo "WARNING: Chromium pre-download failed; will retry at runtime" ) && \
    chown -R nextjs:nodejs ${REMOTION_BROWSER_CACHE}

# Persistent storage volume + writable home for any caches
RUN mkdir -p /data/jobs && chown -R nextjs:nodejs /data /home/nextjs

USER nextjs

EXPOSE 3333

CMD ["npm", "run", "start"]
