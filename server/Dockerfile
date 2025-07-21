# Single-stage build for Node.js server
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=development

# Install runtime dependencies for native modules and system packages
RUN apk add --no-cache \
    dumb-init \
    eudev \
    libc6-compat \
    python3 \
    make \
    g++ \
    linux-headers \
    eudev-dev

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy package files
COPY package.json ./
COPY server/package.json ./server/

# Install ALL dependencies (using npm install to handle missing/outdated lock files)
RUN npm install

# Copy source code
COPY server/src ./server/src
COPY server/tsconfig.json ./server/

# Build TypeScript using npx
RUN npx --workspace=server tsc

# Switch to production mode and clean up
ENV NODE_ENV=production
RUN npm prune --production && \
    apk del python3 make g++ linux-headers eudev-dev

# Create directory for SQLite database
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

USER nodejs

EXPOSE 8000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/dist/server.js"]
