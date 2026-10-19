#!/bin/sh
set -e

mkdir -p /app/data
# Si no hay Postgres/Neon, usa SQLite persistente en el contenedor.
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "file:./dev.db" ]; then
  export DATABASE_URL="file:/app/data/prod.db"
fi

echo "DATABASE_URL provider ready"
echo "Syncing schema (db push)..."
npx prisma db push --skip-generate --accept-data-loss

echo "Seeding admins and catalog (safe to re-run)..."
if npx ts-node --transpile-only prisma/seed.ts; then
  echo "Seed OK"
else
  echo "Seed failed — retrying once..."
  npx ts-node --transpile-only prisma/seed.ts || echo "Seed skipped with errors"
fi

echo "Starting API..."
node dist/main.js
