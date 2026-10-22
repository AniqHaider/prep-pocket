<script lang="ts">
	import type { Scene, SceneNode, EdgeNode, At } from './types';
	import { STAGE_DEFAULT } from './types';
	import { stateAt, rectOf, anchor, centerOf, wrapText, charsFor, contentBottom, ROW_H, HEAD_H, TITLE_H, DEF_COL_W, type NodeState } from './layout';

	/** Draws one step of a scene. Everything stays mounted so CSS transitions animate show/hide/move between steps. */
	let { scene, step }: { scene: Scene; step: number } = $props();

	// the stage is cropped to what the scene actually uses (never taller than authored, never shorter than 150)
	const stage = $derived.by(() => {
		const s = scene.stage ?? STAGE_DEFAULT;
		return { w: s.w, h: Math.min(s.h, Math.max(150, Math.ceil(contentBottom(scene)) + 22)) };
	});
	const st = $derived(stateAt(scene, step));
	const cur = $derived(scene.steps[step]);
	const focus = $derived(new Set(cur?.focus ?? []));
	const pulse = $derived(new Set(cur?.pulse ?? []));
	const all = $derived([...st.values()]);
	const edges = $derived(all.filter((n): n is EdgeNode & { shown: boolean } => n.kind === 'edge'));
	const shapes = $derived(all.filter((n): n is Exclude<NodeState, EdgeNode & { shown: boolean }> => n.kind !== 'edge'));
	const mid = $derived(`arr-${scene.id}`);

	function endpoint(ref: string | At, toward: At): At | null {
		if (typeof ref !== 'string') return ref;
		const n = st.get(ref);
		const r = n ? rectOf(n) : null;
		return r ? anchor(r, toward) : null;
	}
	function centerRef(ref: string | At): At | null {
		if (typeof ref !== 'string') return ref;
		const n = st.get(ref);
		const r = n ? rectOf(n) : null;
		return r ? centerOf(r) : null;
	}
	/** Arrow geometry. Two arrows between the same pair (a request and its response) run side by side, not on top of each other. */
	function geom(e: EdgeNode) {
		const ca = centerRef(e.from), cb = centerRef(e.to);
		if (!ca || !cb) return null;
		let a = endpoint(e.from, cb), b = endpoint(e.to, ca);
		if (!a || !b) return null;
		const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
		const hasReverse = typeof e.from === 'string' && typeof e.to === 'string' && edges.some((o) => o !== e && o.from === e.to && o.to === e.from);
		if (hasReverse) {
			// a reversed arrow has a flipped perpendicular, so one constant offset separates the pair
			const px = (-dy / len) * 7, py = (dx / len) * 7;
			a = { x: a.x + px, y: a.y + py }; b = { x: b.x + px, y: b.y + py };
		}
		const vertical = Math.abs(b.y - a.y) > Math.abs(b.x - a.x);
		const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
		// labels sit beside a vertical arrow, above a horizontal one (on the side its offset pushes it)
		return vertical
			? { a, b, lx: mx + (hasReverse && a.x < (ca.x + cb.x) / 2 ? -9 : 9), ly: my + 4, anchor: hasReverse && a.x < (ca.x + cb.x) / 2 ? 'end' : 'start' }
			: { a, b, lx: mx, ly: my + (hasReverse && a.y > (ca.y + cb.y) / 2 ? 16 : -7), anchor: 'middle' };
	}
	const size = (n: SceneNode) => (n.kind === 'text' ? (n.size === 'lg' ? 15 : n.size === 'sm' ? 10.5 : 12) : 12);
</script>

<svg class="stage" viewBox="0 0 {stage.w} {stage.h}" role="img" aria-label={scene.title} preserveAspectRatio="xMidYMid meet">
	<title>{scene.title}</title>
	<defs>
		<marker id={mid} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
			<path d="M1 1.5L8.5 5L1 8.5" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
		</marker>
	</defs>

	{#each edges as e (e.id)}
		{@const g = geom(e)}
		<g class="edge tone-{e.tone ?? 'neutral'}" class:shown={e.shown} class:dashed={e.dashed} class:focus={focus.has(e.id)}>
			{#if g}
				<path class="line" pathLength="1" d="M{g.a.x} {g.a.y} L{g.b.x} {g.b.y}" marker-end="url(#{mid})" />
				{#if e.label}<text class="elabel" x={g.lx} y={g.ly} text-anchor={g.anchor}>{e.label}</text>{/if}
			{/if}
		</g>
	{/each}

	{#each shapes as n (n.id)}
		{#if true}
			<g class="n k-{n.kind} tone-{n.tone ?? 'neutral'}" class:shown={n.shown} class:focus={focus.has(n.id)} class:pulse={pulse.has(n.id) && n.shown} style="transform: translate({n.x}px, {n.y}px)">
				{#if n.kind === 'box'}
					{@const lines = wrapText(n.label, charsFor(n.w))}
					{@const sub = n.sub ? wrapText(n.sub, charsFor(n.w, 10.5)) : []}
					{@const total = lines.length * 15 + (sub.length ? sub.length * 13 + 2 : 0)}
					{#if n.shape === 'circle'}<ellipse class="shape" cx={n.w / 2} cy={n.h / 2} rx={n.w / 2} ry={n.h / 2} />
					{:else}<rect class="shape" width={n.w} height={n.h} rx={n.shape === 'pill' ? n.h / 2 : 9} />{/if}
					{#each lines as l, i}<text class="lbl" x={n.w / 2} y={n.h / 2 - total / 2 + 12 + i * 15} text-anchor="middle">{l}</text>{/each}
					{#each sub as l, i}<text class="sub" x={n.w / 2} y={n.h / 2 - total / 2 + lines.length * 15 + 12 + i * 13} text-anchor="middle">{l}</text>{/each}
				{:else if n.kind === 'db'}
					{@const lines = wrapText(n.label, charsFor(n.w))}
					<path class="shape" d="M0 8 C0 -2.7 {n.w} -2.7 {n.w} 8 V{n.h - 8} C{n.w} {n.h + 2.7} 0 {n.h + 2.7} 0 {n.h - 8} Z" />
					<path class="rim" d="M0 8 C0 18.7 {n.w} 18.7 {n.w} 8" />
					{#each lines as l, i}<text class="lbl" x={n.w / 2} y={n.h / 2 + 8 - ((lines.length - 1) * 15) / 2 + i * 15} text-anchor="middle">{l}</text>{/each}
					{#if n.sub}<text class="sub" x={n.w / 2} y={n.h + 14} text-anchor="middle">{n.sub}</text>{/if}
				{:else if n.kind === 'table'}
					{@const cw = n.colW ?? DEF_COL_W}
					{@const top = n.title ? TITLE_H : 0}
					{#if n.title}<text class="sub" x="0" y="11">{n.title}</text>{/if}
					<rect class="shape" y={top} width={cw * n.cols.length} height={HEAD_H + ROW_H * n.rows.length} rx="8" />
					{#each n.cols as c, ci}<text class="th" x={ci * cw + 8} y={top + 16}>{c}</text>{/each}
					{#each n.rows as row, ri}
						{#if n.hl?.includes(ri)}<rect class="hlrow" x="2" y={top + HEAD_H + ri * ROW_H} width={cw * n.cols.length - 4} height={ROW_H} rx="5" />{/if}
						{#each row as cell, ci}<text class="td" class:hl={n.hl?.includes(ri)} x={ci * cw + 8} y={top + HEAD_H + ri * ROW_H + 15}>{cell}</text>{/each}
					{/each}
				{:else if n.kind === 'doc'}
					{@const top = n.title ? TITLE_H : 0}
					{#if n.title}<text class="sub" x="0" y="11">{n.title}</text>{/if}
					<rect class="shape" y={top} width={n.w} height={12 + 16 * n.lines.length} rx="8" />
					{#each n.lines as l, i}
						{#if n.hl?.includes(i)}<rect class="hlrow" x="2" y={top + 6 + i * 16} width={n.w - 4} height="16" rx="4" />{/if}
						<text class="code" class:hl={n.hl?.includes(i)} x="10" y={top + 18 + i * 16}>{l}</text>
					{/each}
				{:else if n.kind === 'text'}
					{@const lines = wrapText(n.text, n.w ? charsFor(n.w + 12, size(n)) : 80)}
					{#each lines as l, i}<text class="free" font-size={size(n)} text-anchor={n.anchor ?? 'start'} y={i * (size(n) + 4)}>{l}</text>{/each}
				{:else if n.kind === 'token'}
					<circle class="shape" r={n.r ?? 7} />
					{#if n.label}<text class="sub tok" y={-(n.r ?? 7) - 5} text-anchor="middle">{n.label}</text>{/if}
				{/if}
			</g>
		{/if}
	{/each}
</svg>

<style>
	.stage { width: 100%; height: auto; display: block; overflow: visible; font-family: var(--font); }
	.n { opacity: 0; pointer-events: none; transition: transform .75s cubic-bezier(.4, 0, .2, 1), opacity .45s ease; }
	.n.shown { opacity: 1; }
	.tone-neutral { --fill: var(--raised); --stroke: transparent; --ink: var(--text); }
	.tone-accent { --fill: var(--pill-positive-bg); --stroke: var(--accent); --ink: var(--text); }
	.tone-warn { --fill: var(--pill-warning-bg); --stroke: var(--warning); --ink: var(--text); }
	.tone-neg { --fill: var(--pill-negative-bg); --stroke: var(--negative); --ink: var(--text); }
	.shape { fill: var(--fill); stroke: var(--stroke); stroke-width: 1.5; transition: fill .4s, stroke .4s; }
	.rim { fill: none; stroke: var(--stroke); stroke-width: 1.5; opacity: .6; }
	.k-token .shape { fill: var(--accent); stroke: none; }
	.k-token.tone-warn .shape { fill: var(--warning); }
	.k-token.tone-neg .shape { fill: var(--negative); }
	.k-token.tone-neutral .shape { fill: var(--text); }
	.focus > .shape { stroke: var(--text); stroke-width: 2; }
	.lbl { fill: var(--ink); font-size: 12px; font-weight: 600; }
	.sub { fill: var(--muted); font-size: 10.5px; }
	.th { fill: var(--muted); font-size: 10.5px; font-weight: 500; }
	.td { fill: var(--text); font-size: 11px; font-variant-numeric: tabular-nums; }
	.td.hl, .code.hl { fill: var(--accent); font-weight: 600; }
	.hlrow { fill: var(--pill-positive-bg); }
	.code { fill: var(--text); font-family: var(--mono); font-size: 10.5px; white-space: pre; } /* keep code indentation */
	.free { fill: var(--muted); font-size: 12px; }
	.tone-accent .free, .tone-warn .free, .tone-neg .free { fill: var(--stroke); }
	.pulse > .shape { animation: pulse .9s ease-out 1; }
	@keyframes pulse { 0% { stroke: var(--text); stroke-width: 5; } 100% { stroke-width: 1.5; } }

	.edge { opacity: 0; transition: opacity .3s ease .25s; }
	.edge.shown { opacity: 1; }
	.edge .line { fill: none; stroke: var(--faint); stroke-width: 1.6; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset .6s ease, stroke .3s; }
	.edge.shown .line { stroke-dashoffset: 0; }
	.edge.dashed .line { stroke-dasharray: 0.04 0.03; stroke-dashoffset: 0; }
	.edge.tone-accent .line { stroke: var(--accent); }
	.edge.tone-warn .line { stroke: var(--warning); }
	.edge.tone-neg .line { stroke: var(--negative); }
	.edge.focus .line { stroke: var(--text); }
	.elabel { fill: var(--muted); font-size: 10.5px; paint-order: stroke; stroke: var(--ground); stroke-width: 3px; }
	@media (prefers-reduced-motion: reduce) { .pulse > .shape { animation: none; } }
</style>
