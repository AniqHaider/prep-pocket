# Preppy design system

Direction (2.2): **midnight indigo**. A deep blue-black ground, tinted surfaces, one violet brand colour for actions, and a distinct hue per section on Home.
Preppy is a one-person study app used in short sessions, mostly at night, on an AMOLED phone, so it stays dark and calm.

## Rules

1. **Elevation is lightness.** Ground `#080913` → surface `#12142a` → raised `#232647`. Cards have no border and no shadow at rest. Only things that float (the chat panel) may carry a shadow.
2. **Two colours with jobs.** Violet (`--brand`) is for the primary action, the active menu item and the Home hero. Lime (`--accent`) marks solved, accuracy, streak and progress. Per-section hues appear only on Home tiles and the Continue card.
3. **One primary action per screen**, a violet pill (`.btn.primary`). Secondary is an outlined pill (`.btn`). Destructive actions go last, outlined in `--negative`, with the consequence in words.
4. **Colour is never the only signal.** Correct / wrong / solved always carry an icon or a word as well.
5. **No emoji, no glow.** One gradient is allowed: the Home Continue card. Icons come from `src/ui/Icon.svelte` (one outline set, 1.6 stroke).
6. **One typeface.** Inter (bundled via `@fontsource-variable/inter`, so it works offline). Code uses the system mono. Weights 400/500/600, sentence case, tabular figures on every number.
7. **Accessibility floor.** Touch targets ≥ 44px, text ≥ 12px, text greys `--muted` and `--faint` only (both ≥ 4.5:1 on `--surface`), visible `:focus-visible` ring, `prefers-reduced-motion` honoured, icon-only buttons have `aria-label`, results announced with `role="status"`.

## Tokens

All in `src/app.css`. Radii: card 24, row 16, field 12, control 999. Spacing: gap 14, pad 20. Type: title 20, section 16, body 14, small 12.
The older names (`--bg`, `--panel`, `--line`, `--good`, `--bad`) are aliases of the tokens above so older components keep working; prefer the new names.

## Shell

The app opens on Home (`src/ui/Home.svelte`). A 52px frosted top bar (menu button + section name) and a slide-out menu; the active menu item is a brand-tinted row with a bright label. Each screen has one h1; the app bar title is a plain label.

## Checking changes

```bash
node ~/projects/taste-skill/skills/taste-skill/scripts/lint.mjs --app $(find src -name '*.svelte') src/app.css
node ~/projects/taste-skill/skills/taste-skill/scripts/inspect.mjs --app http://localhost:5180/
```

`.taste-skill/` (the inspector's screenshots and reports) is git-ignored. The remaining lint warnings are known and fine: monospace is used for code blocks, "unlock" is a game term, and a few em dashes sit in lesson copy.
