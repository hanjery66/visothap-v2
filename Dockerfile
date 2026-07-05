FROM oven/bun:1.3.14-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy application source
COPY . .

# Environment
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1

# Build the app
RUN bun run build

EXPOSE 3000

# Start Next.js
CMD ["bun", "run", "start"]