# Kata (prep-pocket) — Windows setup

Everything you need to run, test and build the **Kata** Android app from a Windows 10/11 PC. Written so you can
follow it without Claude or the original Mac.

> **Status of these instructions.** The app and every command's *logic* were built and tested on macOS (including
> a full APK build and an Android 16 emulator run). The Windows-specific parts below follow each tool's official
> Windows docs and the repo's scripts were fixed for Windows paths — but they have **not been executed on a real
> Windows machine yet**. If a step fails, check *Troubleshooting* at the bottom first.

There are two levels. Do **Part A** first — it's quick and needs no Android tooling.

| Goal | Needs |
|---|---|
| **A. Run / edit the app in the browser** (all tabs, offline Python + SQL engines) | Git, Bun, Node |
| **B. Build the APK and install it on your phone** | + JDK 21, Android SDK/NDK/CMake, llama.cpp source |

---

## 0. Install the basics (PowerShell)

Open **PowerShell** (normal, not admin) and install with winget (built into Windows 11 and recent Windows 10):

```powershell
winget install --id Git.Git -e
winget install --id Oven-sh.Bun -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id GitHub.cli -e          # optional: only if you want to push from this PC
```

**Close and reopen PowerShell** afterwards (so `PATH` refreshes), then check:

```powershell
git --version ; bun --version ; node --version
```

Choose a **short folder** for the project (long paths break the Android native build later):

```powershell
mkdir C:\dev ; cd C:\dev
git clone https://github.com/AniqHaider/prep-pocket.git kata
cd kata
```

Turn on long-path support once (run **PowerShell as Administrator**), then reboot or sign out/in:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
git config --system core.longpaths true
```

---

## Part A — run it in the browser

```powershell
cd C:\dev\kata
bun install
bun run dev
```

Open **http://localhost:5180**. `bun run dev` first copies the Pyodide (Python) runtime into `public/pyodide`
(`predev` hook), then starts Vite. To try it on your phone's browser, the dev server also listens on your LAN —
open `http://<your-PC-IP>:5180` (allow the Windows Firewall prompt for Node/Bun).

What runs where (nothing needs a server or database):

| Tab | Engine |
|---|---|
| ⛩️ Dojo | Python in **Pyodide** (WebAssembly), SQL on real Postgres compiled to WASM (**PGlite**) |
| 🧠 Prep | Svelte/TypeScript quiz + theory |
| ⌨️ Drills | TypeScript compiled in-browser with sucrase, run in a Web Worker |
| ⚙️ More | Tutor settings (see below) |

Useful commands:

```powershell
bun run verify     # runs all 147 Dojo reference solutions + 9 drills through the in-browser engines
bun run check      # svelte-check (type checking)
bun run build      # production build into dist\
bun run preview    # serve dist\ on http://localhost:5180
```

`bun run verify` should end with `PASS 147  FAIL 0` and nine `✓` lines. (If Bun misbehaves running the WASM engines on
your machine, try Node 22+: `npx tsx scripts/verify-dojo.ts` — not tested.)

**On-device LLM tutor** only works in the Android app. In the browser, use *More → Dojo tutor* with a Gemini/Claude
API key or a local Ollama server (`OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=*`, URL `http://<ip>:11434/v1`).

---

## Part B — build the APK on Windows

### B1. Install the Android toolchain

```powershell
winget install --id EclipseAdoptium.Temurin.21.JDK -e
winget install --id Google.AndroidStudio -e
```

1. Start **Android Studio** once and finish the first-run wizard (it downloads the SDK to
   `%LOCALAPPDATA%\Android\Sdk`). You do not need to create a project.
2. **More Actions → SDK Manager** (or *Settings → Languages & Frameworks → Android SDK*):
   - **SDK Platforms** tab → tick **Android 16.0 ("Baklava") – API 36**.
   - **SDK Tools** tab → tick *Show Package Details* and install exactly:
     - **Android SDK Build-Tools 36.0.0**
     - **NDK (Side by side) 27.2.12479018**
     - **CMake 3.31.6**
     - **Android SDK Platform-Tools**
     - **Android SDK Command-line Tools (latest)**
3. Accept licences (new PowerShell window after step 4 below):
   `& "$env:LOCALAPPDATA\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat" --licenses`

### B2. Environment variables (persist for your user)

Find the JDK folder (it ends with something like `jdk-21.0.x.x-hotspot`):

```powershell
dir "C:\Program Files\Eclipse Adoptium"
```

Then (edit the JDK folder name to match):

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot", "User")
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
$p = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$p;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
```

Open a **new** PowerShell and check `java -version` (21) and `adb version`.

### B3. Keep updates compatible with your Mac-installed app (important!)

Android only lets an APK **update** an installed app if both are signed with the **same key**. Debug builds are signed
with `~/.android/debug.keystore`, which is different on every computer. If you build on Windows with a fresh key and
try `adb install -r` over the Mac-built app you'll get `INSTALL_FAILED_UPDATE_INCOMPATIBLE` — and uninstalling first
**erases your Dojo progress**.

To avoid that, copy the keystore from the Mac **before your first Windows build**:

- Mac: `~/.android/debug.keystore`
- Windows: `%USERPROFILE%\.android\debug.keystore` (create the `.android` folder if needed; overwrite if Gradle already made one)

If you no longer have the Mac, a fresh install is fine — you just start with empty progress.

### B4. Get llama.cpp (not stored in the repo)

The on-device LLM compiles llama.cpp into the APK. Fetch the exact commit the app was tested against:

```powershell
cd C:\dev\kata
.\scripts\fetch-llama.ps1
```

(Allow scripts for this session if blocked: `Set-ExecutionPolicy -Scope Process Bypass`. Or use **Git Bash** and
run `scripts/fetch-llama.sh`.) It should print `llama.cpp @ 4413a19`.

### B5. Build

```powershell
cd C:\dev\kata
bun install
bun run build                  # web app -> dist\
bunx cap sync android          # copies dist\ into the Android project
cd android
.\gradlew.bat assembleDebug
```

- The **first** build downloads Gradle and compiles llama.cpp for ARM64 — expect several minutes.
- Output: `android\app\build\outputs\apk\debug\app-debug.apk` (~30 MB).
- If Gradle says it can't find the SDK, create `android\local.properties` containing
  `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` (Gradle also honours `ANDROID_HOME`).
- You do **not** run `cap add android` — the `android\` project is already in the repo.

### B6. Install on your phone

1. Phone: *Settings → About phone →* tap **Build number** 7×, then *Developer options →* **USB debugging** on.
2. Plug in via USB, accept the *Allow USB debugging?* prompt, then:

```powershell
adb devices                                  # your phone should say "device", not "unauthorized"
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

Or copy the APK to the phone (Drive, Nearby Share, cable) and open it; allow *Install unknown apps* for that app.

> **Emulator note:** the APK contains ARM64 native code only (OnePlus Nord 4 / modern phones). A normal Windows
> (x86_64) Android emulator can't run it — test on a real phone. Building an x86_64 variant would need a CMake change
> that hasn't been made.

---

## Tutor models on the phone

*More → Dojo tutor → On this phone* downloads a GGUF model (0.5–2.1 GB) once; after that it's offline. Nothing to
install on the PC. For a OnePlus Nord 4 (12 GB RAM) start with **Qwen2.5 1.5B**, try **3B** for better answers.

## Where things live

| Path | What |
|---|---|
| `src/dojo/` | Backend Dojo UI + `engine/` (grading, Pyodide/PGlite workers, XP/streak/diagram ports) |
| `src/prep/` | Svelte/TypeScript quiz + theory |
| `src/drills/` | JS/TS drills + in-browser test runner |
| `src/settings/` | Tutor settings, `localllm.ts` (on-device model catalog) |
| `android/app/src/main/cpp/` | `localllm.cpp` JNI bridge + CMake for llama.cpp |
| `android/app/src/main/java/.../` | `LocalLlmPlugin.java`, `LlamaEngine.java`, `MainActivity.java` |
| `scripts/` | `verify-*.ts`, `copy-pyodide.ts`, `fetch-llama.*`, `make-icons.py` (needs `pip install pillow`) |

## Troubleshooting

| Symptom | Fix |
|---|---|
| `bun` / `node` / `adb` "not recognized" | Close and reopen PowerShell (PATH refresh); re-check B2. |
| `bun run dev` fails at `copy-pyodide` | Make sure you're on the latest commit (older versions used a Unix-only path API). |
| `Filename longer than 260 characters` / CMake or Ninja path errors | Clone to a short path (`C:\dev\kata`) and enable long paths (section 0). |
| `JAVA_HOME is not set` / wrong Java version | Re-do B2; run `java -version` (must be 21). |
| `NDK ... not found` / `CMake 3.31.6 was not found` | SDK Manager → install the **exact** versions in B1. |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Different signing key — see B3 (or `adb uninstall com.aniqhaider.preppocket`, which erases progress). |
| `adb devices` shows `unauthorized` | Unlock the phone and accept the USB-debugging prompt; try another cable/port. |
| `error: bad interpreter` / `\r` errors from `gradlew` or `.sh` | CRLF line endings. The repo's `.gitattributes` forces LF; re-clone or `git add --renormalize .`. |
| Build very slow | Exclude `C:\dev` from Windows Defender real-time scanning (optional). |
| Port 5180 in use | `bun run dev -- --port 5190`. |
