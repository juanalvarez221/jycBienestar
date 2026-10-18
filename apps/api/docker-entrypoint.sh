#!/bin/sh
set -e
echo "Running migrations..."
npx prisma migrate deploy
echo "Seeding (safe to re-run)..."
node -e "require('ts-node/register'); require('./prisma/seed.ts')" 2>/dev/null || npx ts-node prisma/seed.ts || echo "Seed skipped"
echo "Starting API..."
node dist/main.js
