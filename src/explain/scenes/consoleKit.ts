import type { SceneNode, Tone } from '../types';

/**
 * Helpers for lessons that show a cloud console. Two kinds of picture:
 *  - a real screenshot: an `image` node (see `shot`) with `ring` highlights, used where the provider's documentation licence allows it;
 *  - a redrawn console screen: `consoleChrome` (a window frame, a breadcrumb line and tabs) with tables, docs and boxes inside it.
 * Redrawn screens are illustrations of the layout, not copies of the real console.
 */

/** Where redrawn content goes inside `consoleChrome`: x from 24, up to 312 wide, from y 64 down. */
export const CONSOLE = { x: 24, y: 64, w: 312 } as const;

/** A window frame, a breadcrumb line ("brand > service > page") and a row of tabs; `active` is the selected tab. Node ids: `<p>win`, `<p>hd`, `<p>t0..`. All start visible. */
export function consoleChrome(p: string, o: { path: string; tabs?: string[]; active?: number; h: number; y?: number }): SceneNode[] {
	const y = o.y ?? 8;
	const nodes: SceneNode[] = [
		{ id: p + 'win', kind: 'box', x: 12, y, w: 336, h: o.h, label: '', shape: 'panel', visible: true },
		{ id: p + 'hd', kind: 'text', x: 24, y: y + 22, text: o.path, size: 'sm', visible: true }
	];
	const tabs = o.tabs ?? [];
	let x = 24;
	tabs.forEach((t, i) => {
		nodes.push({ id: p + 't' + i, kind: 'text', x, y: y + 46, text: t, size: 'sm', tone: i === (o.active ?? 0) ? 'accent' : 'neutral', visible: true });
		x += t.length * 6.2 + 18;
	});
	return nodes;
}

/** A highlight ring around a region, hidden until a step shows it. */
export const ring = (id: string, x: number, y: number, w: number, h: number, tone: Tone = 'accent'): SceneNode => ({ id, kind: 'box', x, y, w, h, label: '', shape: 'ring', tone });

/** A real screenshot from `public/lessons/...`. `nw`/`nh` are the file's pixel size; the box keeps its aspect unless `h` is given. */
export function shot(id: string, src: string, nw: number, nh: number, o: { x?: number; y?: number; w?: number; h?: number; alt?: string; view?: { x: number; y: number; w: number }; visible?: boolean } = {}): SceneNode {
	const w = o.w ?? 336;
	return { id, kind: 'image', src, nw, nh, x: o.x ?? 12, y: o.y ?? 12, w, h: o.h ?? Math.round((w * nh) / nw), alt: o.alt, view: o.view, visible: o.visible ?? true };
}

/** A small credit line under a real screenshot. */
export const credit = (id: string, y: number, text = 'Screenshot: Google Cloud documentation, CC BY 4.0'): SceneNode => ({ id, kind: 'text', x: 180, y, text, size: 'sm', anchor: 'middle', visible: true });
