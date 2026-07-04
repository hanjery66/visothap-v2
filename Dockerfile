# Use Bun's official Debian-based image for builder stage
FROM oven/bun:1.3.14-slim AS builder
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy application code
COPY . .

# Set environment variable to bypass env checks during build
ENV SKIP_ENV_VALIDATION=1

# Build the Next.js app
RUN bun run build

# Production runner stage
FROM oven/bun:1.3.14-slim AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production

# Copy standalone build assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Start the standalone server directly
CMD ["bun", "server.js"]
