#!/bin/sh
set -e

echo "========================================================="
echo "🚀 SAFED SHERI API CONTAINER INITIALIZATION"
echo "========================================================="

echo "1. Synchronizing Prisma Database Schema..."
npx prisma db push --skip-generate

echo "2. Auto-synchronizing Super Admin Accounts..."
node prisma/seed-admins.js || true

echo "3. Starting NestJS Backend API Service..."
echo "========================================================="
exec node apps/api/dist/src/main.js
