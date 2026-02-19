#!/bin/sh
set -e

# URL-encode the password to handle special characters using Node.js
ENCODED_USERNAME=$(node -p "encodeURIComponent('${DATABASE_USERNAME}')")
ENCODED_PASSWORD=$(node -p "encodeURIComponent('${DATABASE_PASSWORD}')")

# Construct DATABASE_URL from environment variables with URL-encoded credentials
export DATABASE_URL="postgresql://${ENCODED_USERNAME}:${ENCODED_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"

echo "Running database migrations..."
cd ../../packages/prisma
npx prisma migrate deploy --schema=./prisma/schema.prisma
cd ../../apps/api

echo "Starting application..."
exec node dist/index.js
