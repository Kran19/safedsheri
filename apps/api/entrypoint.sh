#!/bin/sh
set -e

echo "========================================================="
echo "🚀 SAFED SHERI API CONTAINER INITIALIZATION"
echo "========================================================="

echo "1. Synchronizing Prisma Database Schema..."
npx prisma db push --skip-generate

echo "2. Seeding Safed Sheri 2026 Test Scenarios (A through G)..."
npx prisma db seed

echo "3. Starting NestJS Backend API Service..."
echo "========================================================="
exec node apps/api/dist/src/main.js
