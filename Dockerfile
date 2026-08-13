# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
# better-sqlite3 v13 ships prebuilt binaries (incl. musl + arm64), so no
# native toolchain is needed on Alpine.
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Where the SQLite database lives (mount a volume here to persist it).
ENV DB_PATH=/data/baby-tracker.db

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# The standalone output bundles a minimal server + traced deps.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Ship the full better-sqlite3 package (all prebuilt binaries) so the image
# runs on both amd64 and arm64 regardless of what tracing selected.
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Persistent data directory, owned by the app user.
RUN mkdir -p /data && chown -R nextjs:nodejs /data
VOLUME ["/data"]

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/state').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
