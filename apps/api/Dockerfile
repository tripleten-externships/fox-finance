# ============================================================================
# Stage 1: Dependencies
# Install all dependencies needed for building
# ============================================================================
FROM node:20-slim AS deps

# Install pnpm globally
RUN npm install -g pnpm@10.17.1

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for all workspace packages
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/api-types/package.json ./packages/api-types/

# Copy Prisma schema (needed for postinstall script)
COPY packages/prisma/prisma ./packages/prisma/prisma

# Install dependencies with frozen lockfile for reproducibility
RUN pnpm install --frozen-lockfile

# ============================================================================
# Stage 2: Build
# Generate Prisma client and compile TypeScript
# ============================================================================
FROM node:20-slim AS builder

# Install pnpm globally
RUN npm install -g pnpm@10.17.1

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=deps /app/packages/prisma/node_modules ./packages/prisma/node_modules
COPY --from=deps /app/packages/api-types/node_modules ./packages/api-types/node_modules

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/api-types/package.json ./packages/api-types/
COPY packages/config/package.json ./packages/config/
COPY packages/prisma/package.json ./packages/prisma/

# Copy Prisma schema and TypeScript configs
COPY packages/prisma/prisma ./packages/prisma/prisma
COPY packages/prisma/src ./packages/prisma/src
COPY packages/prisma/tsconfig.json ./packages/prisma/
COPY packages/prisma/tsconfig.build.json ./packages/prisma/

# Copy root TypeScript config
COPY tsconfig.json ./

# Copy API source code
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

# Copy api-types source if needed
COPY packages/api-types ./packages/api-types
# Copy config package source if needed
COPY packages/config ./packages/config

# Build config package
WORKDIR /app/packages/config
RUN pnpm build

# Set Prisma binary targets for Linux (debian/glibc)
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

# Generate Prisma client with linux binary target
WORKDIR /app/packages/prisma
RUN npx prisma generate

# Build Prisma package
WORKDIR /app/packages/prisma
RUN pnpm build

# Build TypeScript (using tsconfig.json since tsconfig.build.json doesn't exist)
WORKDIR /app/apps/api
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm exec tsc -p tsconfig.json

# ============================================================================
# Stage 3: Production
# Create minimal production image
# ============================================================================
FROM node:20-slim AS production

# Install OpenSSL for Prisma and curl for health checks
RUN apt-get update -y && \
  apt-get install -y openssl curl && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@10.17.1

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/api-types/package.json ./packages/api-types/

# Copy Prisma schema and migrations for runtime
COPY packages/prisma/prisma ./packages/prisma/prisma

# Install production dependencies only (skip scripts since we copy generated client from builder)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy generated Prisma client from builder (pnpm structure)
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/packages/prisma/dist ./packages/prisma/dist

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy api-types if needed at runtime
COPY --from=builder /app/packages/api-types ./packages/api-types
# Copy config package if needed at runtime
COPY --from=builder /app/packages/config ./packages/config

# Copy tsconfig files for tsconfig-paths to resolve aliases
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/apps/api/tsconfig.json ./apps/api/tsconfig.json

# Set working directory to API
WORKDIR /app/apps/api

# Expose port
EXPOSE 4000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Create runtime tsconfig that points to dist instead of src
RUN echo '{\n\
  "extends": "./tsconfig.json",\n\
  "compilerOptions": {\n\
  "baseUrl": "."\n\
  }\n\
  }' > /app/apps/api/tsconfig.runtime.json

# Create startup script that constructs DATABASE_URL, runs migrations, then starts the app
RUN echo '#!/bin/sh\n\
  set -e\n\
  \n\
  # Construct DATABASE_URL from environment variables\n\
  export DATABASE_URL="postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"\n\
  \n\
  echo "Running database migrations..."\n\
  cd ../../packages/prisma && \
  npx prisma migrate deploy\n\
  cd ../../apps/api\n\
  \n\
  echo "Starting application..."\n\
  exec node dist/index.js' > /app/apps/api/start.sh && \
  chmod +x /app/apps/api/start.sh

# Start the application
CMD ["/app/apps/api/start.sh"]