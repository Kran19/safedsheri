#!/bin/sh

echo "========================================================="
echo "🚀 SAFED SHERI API CONTAINER INITIALIZATION"
echo "========================================================="

echo "1. Synchronizing Prisma Database Schema..."
if npx prisma db push --skip-generate --accept-data-loss; then
  echo "   ✅ Database schema synchronized successfully."
else
  echo "   ⚠️  prisma db push failed (non-fatal). API will start with existing schema."
fi

echo "2. Auto-synchronizing Super Admin Accounts..."
node prisma/seed-admins.js || true

echo "3. Starting NestJS Backend API Service..."
echo "========================================================="
exec node apps/api/dist/src/main.js
