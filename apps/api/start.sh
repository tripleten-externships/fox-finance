#!/bin/sh
set -e

# URL-encode the password to handle special characters using Node.js
ENCODED_USERNAME=$(node -p "encodeURIComponent('${DATABASE_USERNAME}')")
ENCODED_PASSWORD=$(node -p "encodeURIComponent('${DATABASE_PASSWORD}')")

# Construct DATABASE_URL from environment variables with URL-encoded credentials
export DATABASE_URL="postgresql://${ENCODED_USERNAME}:${ENCODED_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"

cd ../../packages/prisma

# In dev: reset database to get fresh seed data on each deploy
# In prod: only run migrations without resetting data
if [ "$NODE_ENV" != "production" ]; then
  echo "Development environment detected - resetting database with fresh seed data..."
  npx prisma migrate reset --force --schema=./prisma/schema.prisma
else
  echo "Production environment detected - running migrations only..."
  npx prisma migrate deploy --schema=./prisma/schema.prisma
fi

cd ../../apps/api

echo "Starting application..."
exec node dist/index.js
