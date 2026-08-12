#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/fonts/Dotum-Regular.ttf"
URL="https://raw.githubusercontent.com/googlefonts/gulim/main/fonts/ttf/hinted/dotum-Regular.ttf"

mkdir -p "$ROOT/public/fonts"
echo "Downloading Dotum from the open-source Gulim project..."
curl -fsSL -o "$DEST" "$URL"
echo "Saved to public/fonts/Dotum-Regular.ttf"
