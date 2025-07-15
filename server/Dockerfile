# Multi-stage build for Node.js server
FROM node:22-alpine AS base

# Install dependencies needed for native modules (serialport, better-sqlite3)
FROM base AS deps
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    linux-headers \
    eudev-dev
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    linux-headers \
    eudev-dev

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY . .

# Build the TypeScript application
RUN npm run build --workspace=server

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies for serialport and sqlite3
RUN apk add --no-cache \
    dumb-init \
    eudev

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=nodejs:nodejs /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/server/package.json ./server/package.json

# Create directory for SQLite database
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

USER nodejs

EXPOSE 8000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/dist/server.js"]
