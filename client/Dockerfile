# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies based on the preferred package manager
# Copy both root and client package files
COPY package.json package-lock.json* ./
COPY client/package.json ./client/

# Install dependencies - use npm ci if lock file exists, otherwise npm install
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "No lockfile found, running npm install" && npm install; \
  fi

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules and package files from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/client/package.json ./client/package.json

# Copy all source code
COPY client ./client

# Build the application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=client

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/client/public ./client/public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/static ./client/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "client/server.js"]
