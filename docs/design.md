# Preppy design system

Direction (2.3): **midnight gold**, picked from a set of twenty directions. Near-black ground, warm cream text, thin gold lines, a classical serif for titles.
Preppy is a one-person study app used in short sessions, mostly at night, on an AMOLED phone, so it stays dark and calm.

## Rules

1. **Hairlines, not fills.** Ground `#0a0a0c` → surface `#111114` → raised `#1c1810`. Cards are outlined with a 1px `--rule` line; no shadows. Corners are nearly square (card 6px, row 4px, control 3px).
2. **Gold has jobs.** `--brand` / `--accent` (gold) marks the primary action, the active menu row, tab underlines, progress and your place. Green (`--positive`) is only for correct, red (`--negative`) only for wrong. Nothing else is coloured.
3. **One primary action per screen**, a solid gold button with dark ink (`.btn.primary`). Secondary is an outlined button (`.btn`). Destructive actions go last, outlined in `--negative`, with the consequence in words.
4. **Colour is never the only signal.** Correct / wrong / solved always carry an icon or a word as well.
5. **Type.** Titles and lesson headings: Cormorant Garamond (`--serif`, 600). Everything else: Instrument Sans (`--font`). Code: the system mono. Both bundled, so it works offline. The top bar title is spaced capitals. Small labels are spaced capitals in gold.
6. **No emoji, no glow.** One gradient only: the Home Continue card. Icons come from `src/ui/Icon.svelte` (one outline set, 1.6 stroke).
7. **Accessibility floor.** Touch targets ≥ 44px, text ≥ 12px (labels 11px caps), text greys `--muted` and `--faint` only (both ≥ 4.5:1 on `--surface`), visible `:focus-visible` ring, `prefers-reduced-motion` honoured, icon-only buttons have `aria-label`, results announced with `role="status"`.

## Tokens

All in `src/app.css`. Radii: card 6, row 4, field 4, control 3. Spacing: gap 14, pad 20. Type: title 20, section 16, body 14, small 12.
The older names (`--bg`, `--panel`, `--line`, `--good`, `--bad`) are aliases of the tokens above so older components keep working; prefer the new names.

## Shell

The app opens on Home (`src/ui/Home.svelte`). A 52px frosted top bar (menu button + section name) and a slide-out menu; the active menu item is a brand-tinted row with a bright label. Each screen has one h1; the app bar title is a plain label.

## Checking changes

```bash
node ~/projects/taste-skill/skills/taste-skill/scripts/lint.mjs --app $(find src -name '*.svelte') src/app.css
node ~/projects/taste-skill/skills/taste-skill/scripts/inspect.mjs --app http://localhost:5180/
```

`.taste-skill/` (the inspector's screenshots and reports) is git-ignored. The remaining lint warnings are known and fine: monospace is used for code blocks, "unlock" is a game term, and a few em dashes sit in lesson copy.
