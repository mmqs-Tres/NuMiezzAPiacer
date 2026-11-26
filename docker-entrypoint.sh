#!/bin/bash
set -e

echo "======================================"
echo " Starting MVP Development Environment "
echo "======================================"

echo "--> 1. Installing dependencies (pnpm install)..."
pnpm install

echo "--> 2. Building project (pnpm build)..."
pnpm run build

echo "--> 3. Resetting database (pnpm run db:reset)..."
pnpm run db:reset

echo "--> 4. Starting development server (pnpm run dev)..."
exec pnpm run dev
