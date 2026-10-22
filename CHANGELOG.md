# Changelog

All notable changes to Preppy (called Kata before 1.3.0). Format follows [Keep a Changelog](https://keepachangelog.com/); versions match the
[GitHub releases](https://github.com/AniqHaider/prep-pocket/releases) (APK attached to each). Updates install over the
previous version and keep your progress as long as the APK is signed with the same key (see `SETUP-WINDOWS.md`, B3).

## [1.5.0] — 2026-10-23
Follow-ups to 1.4: narration that no longer stutters, calmer lesson screens, and a content polish pass.

### Changed
- **Narration waits until it can play smoothly.** The neural voices now measure how fast this phone synthesizes speech and buffer enough audio before starting (and after any catch-up), instead of pausing mid-sentence. The first words arrive sooner (about 1 to 3 seconds on the test device). If a voice is too slow for the phone, the app says so and names a lighter one. In Settings → Narration voice each downloaded voice shows how it runs on this phone ("Smooth on this phone", "May pause", "Too slow, will pause") after you play its sample, and "Preparing voice…" shows a percentage.
- **Animated lessons use their space better:** each scene is cropped to the area it actually uses, and the animation and caption sit centred on screen. "Read aloud" in the lesson player shows when the voice is preparing.
- **PostgreSQL playground:** the sample shop is analyzed after loading, so `EXPLAIN` shows realistic row estimates (15 rows, not an invented 1130), and PostgreSQL starts warming up in the background as soon as you open its section.
- **Database content polish after the independent fact-check:**
  - PostgreSQL: more precise wording on index column order and `LIKE 'abc%'`, a clearer composite-index question, a real `NULL` demo, a self-contained `xmin`/`ctid` demo that shows a new row version, and clearer EXPLAIN, MVCC and lost-update lessons.
  - MySQL: the ON vs WHERE lesson now shows the right table at each step; precise semi-sync, durability and clustered-key wording.
  - MongoDB: the real `explain` field names, the exact default write-concern rule (including the arbiter case), the 2-second heartbeat, and two quiz questions reworked from recall into scenarios.

## [1.4.0] — 2026-10-23
Animated lessons, three database sections, and a calmer start.

### Added
- **Visual lessons** (new menu item): 109 short animated walk-throughs where you watch data move, step by step. Play, pause, step, speed 1x/1.5x/2x, and an optional **Read aloud** that uses your narration voice. Back closes the player. Lessons you finished get a check.
- **Backend lab, watch version:** every chapter has a "Watch this chapter" button (59 animated lessons across the 12 chapters), as an alternative to reading.
- **PostgreSQL, MySQL and MongoDB sections** (new "Databases" menu group). Each has 12 topics with short notes and animated lessons (15 / 17 / 18), and an 80-question quiz with explanations (basic to advanced). Quiz progress and missed questions are kept per database.
- **Playgrounds:** real PostgreSQL (in the app, via PGlite) and a MongoDB shell-style playground over one sample shop (customers, products, orders), with example queries, schema reference, `EXPLAIN`, and a Reset button. Every topic's "Try it" button opens the playground with that query filled in. MySQL has no playground because it cannot run inside a phone WebView.

### Changed
- The app no longer opens on Settings: it restores your last content section, else the Backend lab.
- The page behind the menu, the assistant sheet and the lesson player no longer scrolls.
- The React / Next.js / TypeScript quiz now runs on a shared quiz component (same behaviour, same saved progress).

## [1.3.0] — 2026-10-22
Kata is now **Preppy**, with a new look, a new logo and a natural narration voice. The package id is unchanged, so this installs over 1.2.0 and keeps your progress.

### Added
- **Natural narration voices** (Settings → Narration voice): download a neural voice and the lesson read-aloud runs on the phone with no internet. Four choices: Natural (Kokoro, 132 MB, five speakers), Clear (Piper US high quality, 35 MB), Warm (Piper US female, 21 MB) and British (Piper male, 21 MB). Each has a "Play sample". The system voice stays as the default and as the fallback if a voice fails. Voices run through a native engine (sherpa-onnx); the APK grows by about 9 MB.
- A design system for the whole app (`docs/design.md`): true-black surfaces, one typeface (Inter, bundled), one icon set, lime used only on progress.
- Keyboard and switch-access focus rings, 44 px touch targets, reduced-motion support, and screen-reader labels and result announcements across every screen.

### Changed
- **New name and logo:** Preppy, a lime P ending in a full stop. New launcher icon, themed (monochrome) icon and splash screen.
- **No more Japanese theming:** the "Dojo" section is now **Backend lab**, "Dojo tutor" is "Backend tutor", and the menu groups were renamed.
- **Redesign of every screen:** flat surfaces separated by lightness instead of borders and shadows, white primary buttons, no gradients and no emoji icons. One header per screen (the old double header in the backend lab is gone), a single stats strip, plain progress bars, and a neutral explanation panel after a quiz answer. Correct, wrong and solved states always carry an icon or a word, never colour alone.
- The "More" tab is now **Settings**, split into AI models, Narration voice, About and Your data.
- The floating Ask button no longer covers the Next button; every screen reserves space for it.

### Fixed
- The read-aloud play button crashed on WebViews without the system speech engine.

## [1.2.0] — 2026-10-20
### Added
- **✨ Assistant:** an app-wide AI helper behind a floating button in every section except the Dojo (which keeps its own 💬 tutor). It sees what is on screen — the current quiz question (hint-first until you answer), the theory section, or the drill with your code and last test result.
- **Bigger on-device models** (More → AI models → On this phone): Qwen2.5 7B Instruct and Qwen2.5-Coder 7B Instruct (4.7 GB each, for 12 GB phones). Each model now shows its approximate RAM need.
- Shared model call (`runModel`) so the Dojo tutor and the assistant use one provider setting.

### Changed
- More: the tutor settings section is now **AI models** and covers both chats.

### Fixed
- Chats no longer drag you back to the bottom while a reply streams in if you scrolled up. They follow the stream only while you are at the bottom, and sending a message jumps to the new reply (assistant and Dojo tutor).

## [1.1.0] — 2026-10-14
### Added
- **React + Next + TS** section: 500 multiple-choice questions (200 React 19, 200 Next.js 15/16, 100 TypeScript; basic → advanced) with an explanation for every answer. Source bank: [`react-next-typescript-prep`](https://github.com/AniqHaider/react-next-typescript-prep).
- Inline `code` in quiz questions, options and explanations now renders as code.

### Changed
- Navigation moved from a bottom bar to a top app bar with a slide-out menu (☰) so more sections fit. Android Back closes the menu first.
- Version code 2 / name 1.1.

## [1.0.0] — 2026-10-14
First release, offline Android app (Capacitor, Android 13+, arm64).
- **Dojo:** Backend Dojo ported on-device — 12 chapters, 76 Python + 24 SQL exercises, 47 quizzes, XP/streaks, architecture diagram. Python runs in Pyodide, SQL on Postgres-in-WASM (PGlite).
- **Svelte + TypeScript** prep: 100 MCQs plus interview theory scripts.
- **Drills:** 9 JS/TS interview drills with an in-browser test runner.
- **Tutor:** pick Gemini, Claude, an OpenAI-compatible server (e.g. Ollama), or a model that runs on the phone itself via llama.cpp (Qwen2.5 0.5B/1.5B/3B, Llama 3.2 3B).
- App name **Kata** with a new icon; Windows setup guide and PowerShell helper scripts.
