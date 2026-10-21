# Changelog

All notable changes to Kata. Format follows [Keep a Changelog](https://keepachangelog.com/); versions match the
[GitHub releases](https://github.com/AniqHaider/prep-pocket/releases) (APK attached to each). Updates install over the
previous version and keep your progress as long as the APK is signed with the same key (see `SETUP-WINDOWS.md`, B3).

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
