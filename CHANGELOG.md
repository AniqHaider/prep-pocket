# Changelog

All notable changes to Preppy (called Kata before 1.3.0). Format follows [Keep a Changelog](https://keepachangelog.com/); versions match the
[GitHub releases](https://github.com/AniqHaider/prep-pocket/releases) (APK attached to each). Updates install over the
previous version and keep your progress as long as the APK is signed with the same key (see `SETUP-WINDOWS.md`, B3).

## [2.2.1] — 2026-10-27
Python for AI engineering, and a Settings screen you tap into.

### Added
- **Python for AI** (menu, under Learn). What to learn to move into AI engineering with Python, and what each library is for: the tooling around Python, NumPy, pandas, Matplotlib, scikit-learn, PyTorch (tensors, autograd, training loops, GPUs), TensorFlow, JAX and ONNX, how transformers work, the Hugging Face ecosystem, fine-tuning and LoRA, calling LLM APIs, embeddings and RAG, agents and frameworks such as LangChain, evals, serving and quantization, MLOps, vision and speech, and a 12-week learning plan.
- **22 topics, 34 animated lessons and 144 quiz questions** (basic to advanced), starting with a map of how the libraries fit together.

### Fixed
- **The menu slides away.** Tapping outside the menu used to make it vanish; it now slides out and the dim background fades, the same way it opens.

### Changed
- **Back goes Home first.** From a section's top screen, Back returns to Home; from Home it asks "Quit Preppy?". Back still closes anything open on top first (keyboard, menu, assistant, a topic, drill, lesson, quiz screen or a Settings page).
- **Settings is organised.** The quick choices (code keyboard, key vibration, subtitle background) sit at the top. AI models, Narration voice, Keyboard and subtitles, Your data and About each open on their own page, so there is no long scroll. Back returns from a page to Settings.

## [2.2.0] — 2026-10-27
A new look, a Home screen, and a Back button that offers to quit at the top.

### Changed
- **New Home screen.** Preppy opens on Home: a greeting, your streak, XP and solved count, a Continue card for the last section you studied, and a tile for every section, each with its own colour.
- **New look across the whole app.** A deep indigo palette replaces pure black, with softer, rounder cards, a violet primary colour on buttons and the active menu item, and a frosted top bar. Every screen picks it up, including lessons, quizzes, drills, the code keyboard and Settings.
- **Menu.** A Home item at the top; the active section is shown with a tinted row.

### Fixed
- **Back at the top now offers to quit.** On the first screen of any section (or Home), Back asks "Quit Preppy?" instead of jumping to a section you were in before. Back still closes things opened on top, in order: the keyboard, the menu, the assistant, an open topic, drill, lesson or quiz screen. Switching sections or the Learn/Quiz/Playground tabs no longer adds Back steps.

## [2.1.0] — 2026-10-27
Interview prep, a smarter Back button, and a What's new note after each update.

### Added
- **Interview prep** (menu, between Practice and App). What gets asked for SDE 1 and SDE 2 roles, built from interview write-ups and weighted toward full-stack work: 22 topics across JavaScript, TypeScript, React, Next.js, web performance, Node.js, NestJS and Express, API design, auth and security, Python and FastAPI, SQL, MySQL and MongoDB, AWS, Docker and CI/CD, data structures, low-level and high-level design, real system designs, AI features, behavioral questions, SDE 2 expectations and project deep-dives.
- **Model answers.** Every topic is a bank of questions marked SDE 1 or SDE 2, each with a concise answer and, for SDE 2, the follow-ups interviewers ask next.
- **264 quiz questions** (basic is SDE 1, advanced is SDE 2) and **about 80 runnable exercises** in the playground.
- **12 new graded coding drills** in Drills (Interview · SDE 1 and SDE 2): the machine-coding problems that come up most.
- **What's new.** After an update, a short note of what changed appears once, taken from these release notes.

### Changed
- **Back goes to where you were.** Back now steps back through an opened topic, a switched Learn/Quiz/Playground tab, an opened drill and the screens of a quiz, as well as through the sections you visited. The "Quit Preppy?" question only appears at the very first screen.

## [2.0.0] — 2026-10-27
Networking joins Computer science.

### Added
- **Eight new Networking topics** after "Networking: DNS, TCP, TLS": network layers and packets, IP addresses, subnets and NAT, TCP reliability and congestion, UDP, QUIC and HTTP/3, HTTP/1.1 vs HTTP/2 vs HTTP/3, proxies, load balancers and CDNs, real-time (polling, SSE, WebSockets), and debugging the network.
- **Sixteen new animated lessons** for them (encapsulation, packet journey, CIDR, NAT, retransmit, congestion window, UDP vs TCP, QUIC, head-of-line blocking, multiplexing, load balancing, CDN edge, polling vs WebSocket, SSE, traceroute, latency budget), each with narration and subtitles.
- **72 new quiz questions** (basic to advanced) and runnable playground snippets for every topic.

## [1.9.2] — 2026-10-27
Back button fixes and a backspace fix.

### Fixed
- **Backspace and the arrows deleted or moved two steps per tap** on a touchscreen. One tap is now one step; holding still repeats.

### Changed
- **Back closes the code keyboard first.** With the keyboard open, one Back hides it instead of leaving the screen.
- **Back on the first screen asks "Quit Preppy?"** (Stay / Quit) instead of closing the app straight away.

## [1.9.1] — 2026-10-26
More room in landscape, and the code keyboard buzzes.

### Added
- **Key vibration.** Each key on the code keyboard gives a small tap under your finger, so you can feel that it registered. Settings → Code keyboard → Key vibration: No vibration, Light tap (your phone's own keyboard-tap feedback, so it follows Android's touch-feedback setting) or Strong click (the vibration motor's click effect, independent of that setting). Held keys (backspace, arrows) tap once, not on every repeat.

### Changed
- **Landscape coding screens give the header back.** On any screen with a code editor (the playgrounds, Backend lab exercises, Drills) the top bar no longer stays pinned: it scrolls away with the page, and is gone completely while the code keyboard is up. Scroll to the top, or close the keyboard, to reach the menu.

## [1.9.0] — 2026-10-26
An in-app keyboard for writing code.

### Added
- **Code keyboard.** Typing in a code editor (the JavaScript, TypeScript, SQL and MongoDB playgrounds, the Backend lab and the Drills) now shows Preppy's own keyboard instead of the phone's. Letters with Shift (tap twice for caps lock), a numbers layer, and a symbols layer with everything code needs: `( ) { } [ ] < > = ; : " ' \` $ _ | & ! ? / \ + - * % # @ ~ ^`. Brackets and `;` stay on every layer. Also Tab, Undo, cursor keys (hold to repeat; backspace repeats too) and Enter, which keeps the indentation of the line above and adds a level after `{`, `(`, `[` or `:`. Every key has a spoken label for screen readers.
- **Switching back.** "Use the phone keyboard instead" under the keys, or Settings → Code keyboard (In-app / Phone keyboard). With the phone keyboard chosen, a small "Code keyboard" button appears while an editor is focused to switch back. Chat boxes and settings fields always keep the phone keyboard.
- Sideways, the keys are shorter and the editor shrinks to the space above the keyboard, so you can see your code and the output while you type. The chevron key hides the keyboard (tap the editor to bring it back), which is also how you reach the Run button in landscape.

## [1.8.0] — 2026-10-24
AWS lessons, and the animated-lesson player is now a video-style player.

### Added
- **AWS** (new menu item, under Learn): the services a web engineer meets most, with written notes, animated lessons, an 80-question quiz and a few runnable toy models. Know well: S3 (presigned URLs, bucket policies, CORS, lifecycle), CloudFront (cache keys, TTLs, stale-while-revalidate, invalidation), IAM (roles, policies, default deny and explicit deny) and Route 53 with ACM. Know next: RDS and Aurora, ElastiCache, containers (ECR, ECS Fargate, EKS), Lambda with API Gateway, SQS and SNS. Know the idea: MSK, SES, CloudWatch and X-Ray, Secrets Manager and SSM, WAF and Shield.
- **Settings → Lesson subtitles:** choose how solid the subtitle background is (Clear, Light, Medium or Solid) with a live preview. It applies to the subtitle on top of the picture in landscape.

### Changed
- **Video-style player.** The picture scales to fit the whole screen in either orientation, so no lesson is ever cut off or needs scrolling (tall ones, like "Reading an agent trace", used to run off the bottom in landscape).
- **Subtitles instead of a caption block.** The narration is a light subtitle under the picture (upright) or on top of it (landscape, where the picture then gets the full height).
- **Tap the screen to show or hide the controls.** They appear for a few seconds when a lesson starts or when you tap, fade away while it plays, and stay up while it is paused or finished. A thin progress line stays visible. Upright, the top bar and the controls have their own bands above and below the picture, so nothing covers the data; in landscape they overlay the picture and the control bar is one slim row. Controls: play/pause, previous/next step, tappable progress segments, speed, Read aloud, and Next lesson / Done at the end. Pressing Tab on a keyboard also brings them back.
- "Preparing voice…" and "Next lesson starts in a moment · Stay here" float over the picture instead of pushing things around.

## [1.7.1] — 2026-10-24
Landscape finally works properly, and the lesson player no longer jumps around.

### Fixed
- **Landscape on a phone.** The animated-lesson player has a real landscape layout: the animation on the left, and the progress, caption and controls on the right, with no scrolling in the middle of a lesson. The status bar (notification bar) now hides in landscape, and a swipe from the top edge brings it back. Section pages show topics in two columns with a compact header; quiz answers sit in two columns so a question and its options fit on screen; the playgrounds put the editor on the left and the output on the right; the Visual lessons hub has a single scrolling row of topic chips and two columns of lessons; the Backend lab stats strip scrolls away with the page instead of staying pinned.
- **Layout jumps in the lesson player.** The animation box is a fixed size and everything under it (progress, caption, buttons) stays put on every step and every lesson, including while "Preparing voice…" appears (its space is always reserved) and at the end of a lesson (the forward button becomes "Next lesson" or "Done" in the same slot). Measured on a phone-sized screen: identical positions across seven different lessons and a layout-shift total of 0.001.
- **Stuck on the second lesson.** The top bar now has Previous lesson and Next lesson buttons whenever you play more than one lesson ("Play all", "Watch this chapter", a section's lessons).

### Changed
- **Read aloud is on by default** in the animated lessons (it only does something when a voice is available). Turn it off once and it stays off.

## [1.7.0] — 2026-10-23
Six new sections, a JavaScript and TypeScript playground, and lessons that keep the screen on and play through.

### Added
- **Computer science** (new menu item): 15 topics, 28 animated lessons and an 80-question quiz. Bits and text (binary, UTF-8), Big-O, arrays and memory, linked lists, stacks and queues, hash tables, trees, heaps, graphs (BFS/DFS), sorting and searching, recursion and dynamic programming, stack vs heap and garbage collection, processes and threads, networking (TCP, DNS, TLS), the memory hierarchy, and how compilers and runtimes work.
- **AI and agents:** 16 topics, 23 animated lessons and an 80-question quiz. How language models work, tokens and context, prompting, embeddings and search, RAG, tool use, the agent loop, harnesses, context engineering, MCP, multi-agent patterns, evals, safety, cost and caching, fine-tuning vs RAG vs prompting, and on-device models.
- **JavaScript** (14 topics, 21 lessons, 80 questions), **TypeScript** (15 topics, 18 lessons), **React** (13 topics, 25 lessons) and **Next.js** (13 topics, 24 lessons), each with written notes and animated lessons. The TypeScript, React and Next.js quizzes reuse the existing 100 / 200 / 200 questions, regrouped to match the topics, so saved progress is kept.
- **JavaScript / TypeScript playground** for the Computer science, AI, JavaScript and TypeScript sections: every topic has runnable "Try it" snippets (170 in total). Code runs in a sandboxed worker with real event-loop ordering, console output, a 5-second guard against endless loops, and no network. TypeScript has its types stripped, not checked.
- The Visual lessons hub now covers 248 lessons across nine topics.

### Changed
- **Menu regrouped:** Learn (Backend lab, Computer science, AI and agents, Visual lessons), Frontend (JavaScript, TypeScript, React, Next.js), Databases, Practice (Svelte + TypeScript, the 500-question Frontend quiz, Drills), App.
- **"Play all" and "Watch this chapter" now play through:** the next lesson starts by itself after a few seconds ("Next lesson starts in a moment", with a "Stay here" button).

### Fixed
- **The screen no longer goes off while a lesson is playing.** It stays on while an animated lesson plays (including the pause between lessons) and while a chapter is read aloud, and sleeps normally again when you pause, reach the end, or close the player.
- **Moving to the next lesson could leave it on its last step.** The next lesson now always starts from its first step.

## [1.6.1] — 2026-10-23
Faster narration on slow phones, and a sharp logo at launch. (Version 1.6.0 was skipped; this is the release.)

### Added
- **Narration audio cache:** every sentence a neural voice speaks is saved on the phone, so the second listen is instant even with the heaviest voice (Natural: 913 ms to synthesize, 30 ms from the cache, byte-identical audio, measured on the test device). In the animated-lesson player, with Read aloud on, the rest of the lesson's captions (and the first two of the next lesson) are prepared in the background while step 1 plays. Settings → Narration voice has a "Narration cache" row: size used, a 100 / 200 / 500 MB limit (least recently used sentences go first), and Clear cache.
- **Find fastest setting:** a per-voice button that tries 1 to 4 threads (and your phone's fast-core count), measures each, and keeps the quickest, because on phones with fast and slow cores more threads can be slower. It shows the result ("2 threads 0.92x, 3 threads 0.71x, 4 threads 0.85x, using 3 threads").
- Each downloaded voice now shows its measured speed as a number ("0.71x real time"; under 1x keeps up with speech, lower is faster) next to its Smooth / May pause / Too slow label.

### Fixed
- **Blurry logo on launch.** The launch screen and the home-screen icon used a small raster image that Android scaled up. Both are now vector drawables drawn from the same logo geometry, so they are sharp on any screen. The launch screen is also pure black now (it was showing a leftover stretched splash image and a navy flash).
- A voice's saved speed is used from the first sentence, so each caption in the player no longer re-learns a slow voice's speed.

### Notes
- Natural (Kokoro) barely speeds up with more threads on the test device, so for that voice the cache is the main fix: the first listen of a lesson can still pause; repeats will not.

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
