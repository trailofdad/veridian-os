# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
# Install runtime dependencies for native modules and system packages
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    linux-headers \
    eudev-dev

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY server/package.json ./server/

# Install dependencies - use npm ci if lock file exists, otherwise npm install
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "No lockfile found, running npm install" && npm install; \
  fi

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy source code
COPY server/src ./server/src
COPY server/tsconfig.json ./server/

# Build TypeScript
RUN npx --workspace=server tsc

# 3. Production image, copy all the files and run server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    eudev \
    libc6-compat

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application and production node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/package.json ./package.json

# Prune dev dependencies
RUN npm prune --production

# Create directory for SQLite database
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

USER nodejs

EXPOSE 8000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/dist/server.js"]
