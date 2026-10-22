<p align="center"><img src="assets/icon.png" width="120" alt="Preppy icon"></p>

# Preppy

*A pocket study app for software engineers. (repo: `prep-pocket`; called Kata before 1.3.0)*

[![Download APK](https://img.shields.io/badge/Download-Preppy%20v1.5.0%20APK-3DDC84?logo=android&logoColor=white)](https://github.com/AniqHaider/prep-pocket/releases/latest/download/Preppy-v1.5.0.apk)

> Changes per version: **[CHANGELOG.md](CHANGELOG.md)** · Design rules: **[docs/design.md](docs/design.md)**

> **Windows?** See **[SETUP-WINDOWS.md](SETUP-WINDOWS.md)** for a step-by-step guide (browser dev + building the APK).

One Android app (Android 16 / API 36, minSdk 33) that bundles four prep projects, **fully offline**, behind a slide-out menu (☰) instead of a bottom bar:

| Tab | What | Engine |
|---|---|---|
| **Backend lab** | 12 chapters, 76 Python + 24 SQL exercises + 47 quizzes, XP/streaks, growing architecture diagram | Python in **Pyodide** (WASM), SQL on real Postgres in **PGlite** (WASM) |
| **Visual lessons** | 109 short animated explainers (watch data move, step by step) with play/pause/step/speed and optional read-aloud; every Backend lab chapter also has a "Watch this chapter" button | data-driven SVG scenes, no dependencies |
| **PostgreSQL · MySQL · MongoDB** | Each: 12 topics with notes and animated lessons, an 80-question quiz, and (PostgreSQL, MongoDB) a playground over a sample shop with a Try it button on every topic | PGlite (real Postgres in WASM), mingo (MongoDB query engine) |
| **Svelte + TypeScript** | 100 MCQs with explanations + Svelte/TypeScript interview theory | plain Svelte 5 |
| **React + Next + TS** | **500 MCQs** (200 React 19 · 200 Next.js 15/16 · 100 TypeScript), basic → advanced, every answer explained | plain Svelte 5 over the question bank from `react-next-typescript-prep` |
| **Drills** | 9 JS/TS interview drills (debounce, promise pool, LRU, event loop…) | TypeScript → JS via sucrase, run in a Web Worker |
| **Assistant** | An app-wide AI helper (floating Ask button in every section except the Backend lab, which keeps its own tutor). It sees what you're looking at — the quiz question, theory section or drill + your code — so you can just ask "hint?" or "why?" | same model as the tutor |
| **Settings** | AI model settings — **an LLM that runs on the phone itself** (llama.cpp), or Gemini / Claude / an OpenAI-compatible server such as Ollama; a natural **narration voice** you can download (Kokoro / Piper, runs on the phone); export/reset progress | llama.cpp (CPU) via a native Capacitor plugin |

Copied from `backend-dojo`, `svelte-typescript-prep`, `react-next-typescript-prep`, `stock-company-prep/exercises` (originals untouched).
The Backend lab's old FastAPI/Postgres/`claude`-CLI backend is replaced by on-device ports (`src/dojo/engine/`): same grading, XP, streak and diagram-unlock rules.

## Install on your phone
Download **[Preppy-v1.5.0.apk](https://github.com/AniqHaider/prep-pocket/releases/latest/download/Preppy-v1.5.0.apk)** (≈50 MB, debug-signed, arm64) from the [latest release](https://github.com/AniqHaider/prep-pocket/releases/latest), then:
- **USB:** enable *Developer options → USB debugging*, then `adb install -r Preppy-v1.5.0.apk`
- **File transfer:** send the APK to the phone (Drive, Telegram, WhatsApp "document", Nearby Share, cable), open it, allow *Install unknown apps* for that app. Play Protect may warn about an unknown developer — that's expected for a self-built APK.

## AI (optional)
The Backend lab's **Ask tutor** and the app-wide **Assistant** share one model, chosen in Settings → AI models:
- **On this phone (offline)** — no Mac, no internet after a one-time model download, no account. Pick a model (stored privately in the app), tap *Download*, and ask. Catalog (open-weights, Q4_K_M GGUF from Hugging Face): Qwen2.5 **7B** and Qwen2.5-**Coder** 7B (4.7 GB each, best quality — need a 12 GB phone, replies are slow), Qwen2.5 **3B** (2.1 GB, best everyday pick), **1.5B** (1.1 GB, balanced), Llama 3.2 3B (2.0 GB), Qwen2.5 0.5B (0.5 GB, testing only). Inference is llama.cpp on the CPU with the best ARM variant (dotprod/i8mm/SVE) picked at runtime; the first question after a restart loads the model (~10–30 s). Small models make mistakes — treat answers as hints.
- **Gemini** / **Claude**: paste an API key (stored only on the phone). Needs internet.
- **Local server**: Ollama etc. on a machine reachable from the phone — `OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* ollama serve`, URL `http://<ip>:11434/v1`.
Everything else works with no network and no tutor.

## Narration voice (optional)
Lesson read-aloud uses the phone's system voice by default. For a smoother voice, open Settings → Narration voice and download one (Natural/Kokoro 132 MB, Clear/Piper 35 MB, Warm/Piper 21 MB, British/Piper 21 MB). The voices run on the phone through sherpa-onnx; after the one-time download, narration works offline. Downloads come from the sherpa-onnx GitHub releases. Natural is the most human-sounding and the slowest to prepare; on a slower phone it may pause between sentences, so try Clear or Warm.

## Develop
```bash
bun install
bun run dev                 # http://localhost:5180 (mobile viewport in devtools)
bun run verify              # runs all 147 Backend lab reference solutions + 9 drills through the in-browser engines
bun run check               # svelte-check
```

## Build the APK
One-time toolchain: `brew install openjdk@21 && brew install --cask android-commandlinetools`, then
`sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.2.12479018" "cmake;3.31.6"`.
llama.cpp and the sherpa-onnx native libs are not vendored: run `scripts/fetch-llama.sh` and `scripts/fetch-sherpa.sh` first.
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21 ANDROID_HOME=$HOME/Library/Android/sdk
scripts/fetch-llama.sh && scripts/fetch-sherpa.sh
bun run build && bunx cap sync android
cd android && ./gradlew assembleDebug      # → app/build/outputs/apk/debug/app-debug.apk
```
`scripts/make-icons.py` regenerates the launcher icons.

## Notes
- Pyodide's CPython has no OpenSSL, so `hashlib.pbkdf2_hmac` is a verified (RFC 6070) shim over `hmac.digest` (`python-core.ts`).
- Native code lives in `android/app/src/main/{cpp,java}` (`localllm.cpp` JNI bridge, `LocalLlmPlugin.java`, and `LocalTtsPlugin.java` for the narration voices); the APK is arm64-only and requires Android 13+ (minSdk 33).
- Capacitor serves the app from `http://localhost` (a secure context) with cleartext allowed, so a LAN LLM over plain HTTP isn't blocked as mixed content.
- Progress is stored in WebView localStorage; uninstalling the app erases it (use *Settings → Export*).
