# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine AS base

# 1. Install dependencies with full source context
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy the entire source code into deps
COPY . ./

# Install top-level dependencies first
RUN npm install

# Install client workspace dependencies
RUN npm install --workspace=client

# Install the correct SWC binary for ARM64/Alpine
RUN npm install --save-dev @next/swc-linux-arm64-musl

# 1.5. Development stage - for hot reloading and development
FROM deps AS development
WORKDIR /app

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=client"]

# 2. Build the source code
FROM base AS builder
WORKDIR /app

# Copy everything from deps (source + installed dependencies)
COPY --from=deps /app ./

# Build the Next.js application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=client

# Debug: Check what was actually built
RUN echo "Checking standalone output:" && ls -la /app/client/.next/standalone/ || echo "No standalone directory"

# 3. Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output (should now include node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/static ./client/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "client/server.js"]
