# Writing animated explainers

An explainer ("scene") is **data**, not code: a stage of named nodes and a list of steps. `src/explain/Explainer.svelte` animates between
steps (things fade in, tokens glide, arrows draw themselves) and the player adds play / pause / step / speed / read aloud.
Types: `src/explain/types.ts`. Working examples: `be-request-journey` (`scenes/backend/part1.ts`) and `pg-index-vs-scan` (`scenes/postgres.ts`).

## Anatomy

```ts
{
  id: 'pg-index-vs-scan',        // prefix: be- (Backend lab), pg- (PostgreSQL), my- (MySQL), mg- (MongoDB)
  topic: 'postgres',             // 'backend' | 'postgres' | 'mysql' | 'mongodb'
  group: 'indexes',              // backend: chapter id ch1..ch12 · databases: the id of the topic it belongs to
  title: 'Why an index makes lookups fast',   // <= 42 chars
  blurb: 'How does Postgres find one row among millions?',  // one line: the question this answers
  nodes: [ ... ], steps: [ ... ]
}
```

Stage is **360 x 300** virtual units (set `stage: { w: 360, h: 340 }` for taller; keep w = 360). It scales to the phone width, so a 12px label is
about 12px on screen. Everything must fit inside it.

## Nodes (`x`,`y` = top-left, except `text`: baseline origin, and `token`: centre)

| kind | fields | notes |
|---|---|---|
| `box` | `w h label sub? shape?('rect'\|'pill'\|'circle')` | label wraps; ~6px per character, so `w` 120 fits ~18 chars per line. `h` >= 15 x lines + 13 x sub lines + 6 |
| `db` | `w h label sub?` | a database cylinder; `sub` prints under it |
| `table` | `cols rows colW? title? hl?` | width = colW x cols (default colW 62); rows 22px; `hl` = highlighted row indexes (change per step with `set`) |
| `doc` | `w lines title? hl?` | JSON-ish card, one string per line, monospace ~6.3px per char |
| `text` | `text w? size?('sm'\|'md'\|'lg') anchor?` | free text; `w` makes it wrap |
| `token` | `label? r?` | a dot that `move` slides: a request, a row, a lock, a user |
| `edge` | `from to label? dashed?` | `from`/`to` are node ids (or `{x,y}`); drawn in when shown. Two edges between the same pair (request and response) are drawn side by side automatically |

Common: `id` (unique in the scene), `visible: true` (on stage from the start; everything else is hidden until a step shows it), `tone`:
`neutral` (default) · `accent` (lime: the thing we follow, success, the fast path) · `warn` (amber: slow, risky, waiting) · `neg` (red: failure, conflict).

## Steps

```ts
{ say: 'Caption: one or two plain sentences.',
  show: ['id'], hide: ['id'],             // fade in / out
  set: { t: { hl: [2] }, b: { tone: 'warn', label: 'Locked' } },   // cumulative property changes (text, rows, hl, tone...)
  move: { tok: { x: 40, y: 150 } },       // cumulative; tokens glide, attached arrows follow
  focus: ['id'],                          // white outline for this step only
  pulse: ['id'] }                         // brief pulse on arrival, this step only
```
State is cumulative: step N shows everything up to N, so the player can jump to any step. Every step must change something on screen.

## Craft rules

1. **One idea per scene**, 5 to 9 steps, the first step shows the starting situation, the last shows the payoff.
2. **Captions** are 1 to 2 sentences, at most 190 characters, plain words, jargon explained the first time. Audience: a frontend developer (JS/React/Next) learning backend and databases. Say what is happening *and why it matters*. No emoji.
3. **Layout**: prefer **vertical flows** (top to bottom) on this portrait stage: arrows have room for labels beside them. Horizontal arrows need a gap at least as wide as their label (about 6.2px per character) + 8. Do not overlap nodes; leave 14px+ between nodes. Show at most about 8 things at once; reveal progressively.
4. **Motion means something**: use a `token` to carry the thing that moves (request, row, transaction); `focus` where to look; `tone` only when it carries meaning (accent = success/fast path, warn = cost/risk, neg = failure). Do not colour decoratively.
5. **Be accurate.** Tables and numbers must add up and match what the caption says. Use realistic, small data (names like Asha, Ben, Chen; cities; order ids). Show real SQL / commands in `text` or `doc` nodes, never pseudo-code that would not run (unless the caption says so).
6. Consistent layout across scenes of one topic helps: put "the query" at the top-left, the data below.

## Checking your work

```bash
bun run content pg-        # scenes with that id prefix  (be-, pg-, my-, mg-)
bun run content postgres   # the engine's topics + quiz + its scenes
bun run check              # type-check
```
`bun run content` flags nodes outside the stage, overlapping nodes, text that does not fit, labels wider than their arrow, unknown ids, captions that are too long/short, steps that change nothing.
**Look at it:** with `bun run dev` running, open `http://localhost:5180/#gallery:pg-` in your own browser tab (all steps of every matching scene as a filmstrip). Check at least one scene per topic by eye; the validator cannot see taste.
