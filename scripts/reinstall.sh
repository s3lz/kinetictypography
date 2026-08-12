#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Reinstalling dependencies with project-local npm config..."
rm -rf node_modules package-lock.json
npm --userconfig .npmrc.local install

echo "Done. Start the app with: node scripts/dev.mjs"
