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

RUN npm run build

# Install and pre-bundle Remotion subproject
RUN cd remotion && npm ci && npm run build 2>/dev/null || true

# ── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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
COPY --from=deps /app/node_modules ./node_modules

# Built Next.js app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.* ./

# Remotion subproject with its own node_modules + pre-built bundle
COPY --from=builder /app/remotion ./remotion

# Persistent storage volume
RUN mkdir -p /data/jobs && chown -R nextjs:nodejs /data

USER nextjs

EXPOSE 3333

CMD ["npm", "run", "start"]
