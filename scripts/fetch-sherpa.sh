#!/usr/bin/env bash
# Fetches the prebuilt sherpa-onnx native libraries (offline TTS: Kokoro / Piper voices) that this app was built and
# tested against. arm64-v8a only. Not committed to git (android/app/src/main/jniLibs is ignored).
# The matching Java API classes are vendored in android/app/src/main/java/com/k2fsa/sherpa/onnx/.
set -euo pipefail
VERSION=1.13.8
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/android/app/src/main/jniLibs/arm64-v8a"
STAMP="$OUT/.sherpa-version"
if [ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$VERSION" ] && [ -f "$OUT/libsherpa-onnx-jni.so" ]; then
  echo "sherpa-onnx $VERSION already present"; exit 0
fi
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/v$VERSION/sherpa-onnx-v$VERSION-android.tar.bz2"
if [ -n "${SHERPA_TARBALL:-}" ]; then
  echo "Using local archive $SHERPA_TARBALL"; cp "$SHERPA_TARBALL" "$TMP/android.tar.bz2"
else
  echo "Downloading $URL (~46 MB)"
  curl -fL --retry 3 -o "$TMP/android.tar.bz2" "$URL"
fi
tar -xjf "$TMP/android.tar.bz2" -C "$TMP"
SRC="$(find "$TMP" -type d -name arm64-v8a | head -1)"
[ -n "$SRC" ] || { echo "arm64-v8a libs not found in the archive" >&2; exit 1; }
mkdir -p "$OUT"
cp "$SRC"/libonnxruntime.so "$SRC"/libsherpa-onnx-jni.so "$OUT"/
echo "$VERSION" > "$STAMP"
echo "sherpa-onnx $VERSION -> $OUT"
