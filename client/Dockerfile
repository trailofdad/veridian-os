# Simple single-stage build for Next.js client
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=development

# Install runtime dependencies
RUN apk add --no-cache libc6-compat

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package.json ./
COPY client/package.json ./client/

# Install ALL dependencies (using npm install to handle missing/outdated lock files)
# This will generate a new package-lock.json if needed
RUN npm install

# Copy source code
COPY client ./client

# Build Next.js application
RUN npm run build --workspace=client

# Switch to production and clean up dev dependencies
ENV NODE_ENV=production
RUN npm prune --production

# Create proper permissions
RUN mkdir -p ./client/.next && chown nextjs:nodejs ./client/.next

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "client/.next/standalone/client/server.js"]
