#!/usr/bin/env bash
# Fetches llama.cpp at the exact commit this app was built and tested against (not committed to git).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/android/app/src/main/cpp/llama.cpp"
COMMIT=4413a192410fad1f054e9216114087a3e01527a0
if [ ! -d "$DIR/.git" ]; then git clone https://github.com/ggml-org/llama.cpp.git "$DIR"; fi
git -C "$DIR" fetch --depth 1 origin "$COMMIT" 2>/dev/null || git -C "$DIR" fetch origin
git -C "$DIR" checkout -q "$COMMIT"
echo "llama.cpp @ $(git -C "$DIR" rev-parse --short HEAD)"
