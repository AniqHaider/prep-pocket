# Prep Pocket

One Android app (Android 16 / API 36, minSdk 24) that bundles three prep projects, **fully offline**:

| Tab | What | Engine |
|---|---|---|
| ⛩️ **Dojo** | Backend Dojo — 12 chapters, 76 Python + 24 SQL exercises + 47 quizzes, XP/streaks, growing architecture diagram | Python in **Pyodide** (WASM), SQL on real Postgres in **PGlite** (WASM) |
| 🧠 **Prep** | Svelte + TypeScript: 100 MCQs with explanations + Svelte/TypeScript interview theory | plain Svelte 5 |
| ⌨️ **Drills** | 9 JS/TS interview drills (debounce, promise pool, LRU, event loop…) | TypeScript → JS via sucrase, run in a Web Worker |
| ⚙️ **More** | Tutor settings (Gemini / Claude / any OpenAI-compatible server e.g. Ollama), export/reset progress | — |

Copied from `backend-dojo`, `svelte-typescript-prep`, `stock-company-prep/exercises` (originals untouched).
The Dojo's old FastAPI/Postgres/`claude`-CLI backend is replaced by on-device ports (`src/dojo/engine/`): same grading, XP, streak and diagram-unlock rules.

## Install on your phone
`prep-pocket-debug.apk` (≈18 MB, debug-signed):
- **USB:** enable *Developer options → USB debugging*, then `adb install -r prep-pocket-debug.apk`
- **File transfer:** send the APK to the phone (Drive, Telegram, WhatsApp "document", Nearby Share, cable), open it, allow *Install unknown apps* for that app. Play Protect may warn about an unknown developer — that's expected for a self-built APK.

## Tutor (optional)
Dojo → **Ask** needs an LLM. More → Tutor settings:
- **Gemini** / **Claude**: paste an API key (stored only on the phone).
- **Local LLM**: on the Mac run `OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* ollama serve`, then Server URL `http://<mac-ip>:11434/v1`, model e.g. `llama3.2` (phone and Mac on the same Wi-Fi).
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
`sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"`.
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21 ANDROID_HOME=$HOME/Library/Android/sdk
bun run build && bunx cap sync android
cd android && ./gradlew assembleDebug      # → app/build/outputs/apk/debug/app-debug.apk
```
`scripts/make-icons.py` regenerates the launcher icons.

## Notes
- Pyodide's CPython has no OpenSSL, so `hashlib.pbkdf2_hmac` is a verified (RFC 6070) shim over `hmac.digest` (`python-core.ts`).
- Capacitor serves the app from `http://localhost` (a secure context) with cleartext allowed, so a LAN LLM over plain HTTP isn't blocked as mixed content.
- Progress is stored in WebView localStorage; uninstalling the app erases it (use *More → Export*).
