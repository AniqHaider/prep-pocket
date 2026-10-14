<p align="center"><img src="assets/icon.png" width="120" alt="Kata icon"></p>

# Kata — pocket dev dojo

*(repo: `prep-pocket`)*

[![Download APK](https://img.shields.io/badge/Download-Kata%20v1.0.0%20APK-3DDC84?logo=android&logoColor=white)](https://github.com/AniqHaider/prep-pocket/releases/latest/download/Kata-v1.0.0.apk)

> **Windows?** See **[SETUP-WINDOWS.md](SETUP-WINDOWS.md)** for a step-by-step guide (browser dev + building the APK).

One Android app (Android 16 / API 36, minSdk 33) that bundles three prep projects, **fully offline**:

| Tab | What | Engine |
|---|---|---|
| ⛩️ **Dojo** | Backend Dojo — 12 chapters, 76 Python + 24 SQL exercises + 47 quizzes, XP/streaks, growing architecture diagram | Python in **Pyodide** (WASM), SQL on real Postgres in **PGlite** (WASM) |
| 🧠 **Prep** | Svelte + TypeScript: 100 MCQs with explanations + Svelte/TypeScript interview theory | plain Svelte 5 |
| ⌨️ **Drills** | 9 JS/TS interview drills (debounce, promise pool, LRU, event loop…) | TypeScript → JS via sucrase, run in a Web Worker |
| ⚙️ **More** | Tutor settings — **an LLM that runs on the phone itself** (llama.cpp), or Gemini / Claude / an OpenAI-compatible server such as Ollama; export/reset progress | llama.cpp (CPU) via a native Capacitor plugin |

Copied from `backend-dojo`, `svelte-typescript-prep`, `stock-company-prep/exercises` (originals untouched).
The Dojo's old FastAPI/Postgres/`claude`-CLI backend is replaced by on-device ports (`src/dojo/engine/`): same grading, XP, streak and diagram-unlock rules.

## Install on your phone
Download **[Kata-v1.0.0.apk](https://github.com/AniqHaider/prep-pocket/releases/latest/download/Kata-v1.0.0.apk)** (≈30 MB, debug-signed, arm64) from the [latest release](https://github.com/AniqHaider/prep-pocket/releases/latest), then:
- **USB:** enable *Developer options → USB debugging*, then `adb install -r Kata-v1.0.0.apk`
- **File transfer:** send the APK to the phone (Drive, Telegram, WhatsApp "document", Nearby Share, cable), open it, allow *Install unknown apps* for that app. Play Protect may warn about an unknown developer — that's expected for a self-built APK.

## Tutor (optional)
Dojo → **Ask** needs an LLM. More → Dojo tutor:
- **On this phone (offline)** — no Mac, no internet after a one-time model download, no account. Pick a model (stored privately in the app), tap *Download*, and ask. Catalog (open-weights, Q4_K_M GGUF from Hugging Face): Qwen2.5 **3B** (2.1 GB, smartest), **1.5B** (1.1 GB, balanced), Llama 3.2 3B (2.0 GB), Qwen2.5 0.5B (0.5 GB, testing only). Inference is llama.cpp on the CPU with the best ARM variant (dotprod/i8mm/SVE) picked at runtime; the first question after a restart loads the model (~10–30 s). Small models make mistakes — treat answers as hints.
- **Gemini** / **Claude**: paste an API key (stored only on the phone). Needs internet.
- **Local server**: Ollama etc. on a machine reachable from the phone — `OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* ollama serve`, URL `http://<ip>:11434/v1`.
Everything else works with no network and no tutor.

## Develop
```bash
bun install
bun run dev                 # http://localhost:5180 (mobile viewport in devtools)
bun run verify              # runs all 147 Dojo reference solutions + 9 drills through the in-browser engines
bun run check               # svelte-check
```

## Build the APK
One-time toolchain: `brew install openjdk@21 && brew install --cask android-commandlinetools`, then
`sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.2.12479018" "cmake;3.31.6"`.
llama.cpp is not vendored — fetch the pinned commit first: `scripts/fetch-llama.sh`.
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21 ANDROID_HOME=$HOME/Library/Android/sdk
scripts/fetch-llama.sh
bun run build && bunx cap sync android
cd android && ./gradlew assembleDebug      # → app/build/outputs/apk/debug/app-debug.apk
```
`scripts/make-icons.py` regenerates the launcher icons.

## Notes
- Pyodide's CPython has no OpenSSL, so `hashlib.pbkdf2_hmac` is a verified (RFC 6070) shim over `hmac.digest` (`python-core.ts`).
- Native code lives in `android/app/src/main/{cpp,java}` (`localllm.cpp` JNI bridge, `LocalLlmPlugin.java`); the APK is arm64-only and requires Android 13+ (minSdk 33).
- Capacitor serves the app from `http://localhost` (a secure context) with cleartext allowed, so a LAN LLM over plain HTTP isn't blocked as mixed content.
- Progress is stored in WebView localStorage; uninstalling the app erases it (use *More → Export*).
