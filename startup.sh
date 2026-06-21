#!/bin/sh
set -e

echo "Running database migrations..."
bun drizzle-kit migrate

echo "Seeding the database..."
bun src/db/seed.ts

echo "Starting Next.js server..."
bun run start
