import type { Scene, SceneNode, Step, At } from './types';

export const ROW_H = 22;
export const HEAD_H = 24;
export const TITLE_H = 16;
export const DEF_COL_W = 62;
const CHAR_W = 6.2; // approx px per char at 11-12px Inter, used to wrap and to validate

export interface Rect { x: number; y: number; w: number; h: number }

export type NodeState = SceneNode & { shown: boolean };

/** Node state after applying steps 0..i (cumulative show/hide/set/move). */
export function stateAt(scene: Scene, i: number): Map<string, NodeState> {
	const m = new Map<string, NodeState>();
	for (const n of scene.nodes) m.set(n.id, { ...n, shown: !!n.visible } as NodeState);
	for (let s = 0; s <= i && s < scene.steps.length; s++) {
		const st: Step = scene.steps[s];
		st.show?.forEach((id) => { const n = m.get(id); if (n) n.shown = true; });
		st.hide?.forEach((id) => { const n = m.get(id); if (n) n.shown = false; });
		if (st.set) for (const [id, patch] of Object.entries(st.set)) { const n = m.get(id); if (n) Object.assign(n, patch); }
		if (st.move) for (const [id, at] of Object.entries(st.move)) { const n = m.get(id) as (NodeState & At) | undefined; if (n) { n.x = at.x; n.y = at.y; } }
	}
	return m;
}

export function wrapText(text: string, maxChars: number): string[] {
	const out: string[] = [];
	for (const para of text.split('\n')) {
		let line = '';
		for (const word of para.split(/\s+/).filter(Boolean)) {
			if (line && (line + ' ' + word).length > maxChars) { out.push(line); line = word; }
			else line = line ? line + ' ' + word : word;
		}
		out.push(line);
	}
	return out;
}

export const charsFor = (w: number, size = 12) => Math.max(4, Math.floor((w - 12) / (CHAR_W * (size / 12))));

export function rectOf(n: SceneNode): Rect | null {
	switch (n.kind) {
		case 'box':
		case 'db':
			return { x: n.x, y: n.y, w: n.w, h: n.h };
		case 'table': {
			const cw = n.colW ?? DEF_COL_W;
			return { x: n.x, y: n.y, w: cw * n.cols.length, h: (n.title ? TITLE_H : 0) + HEAD_H + ROW_H * n.rows.length };
		}
		case 'doc':
			return { x: n.x, y: n.y, w: n.w, h: (n.title ? TITLE_H : 0) + 12 + 16 * n.lines.length };
		case 'text': {
			const lines = wrapText(n.text, n.w ? charsFor(n.w + 12) : 60).length;
			const w = n.w ?? n.text.length * CHAR_W;
			const lh = n.size === 'lg' ? 20 : n.size === 'sm' ? 14 : 16;
			return { x: n.anchor === 'middle' ? n.x - w / 2 : n.anchor === 'end' ? n.x - w : n.x, y: n.y - lh, w, h: lh * lines };
		}
		case 'token': {
			const r = n.r ?? 7;
			return { x: n.x - r, y: n.y - r, w: r * 2, h: r * 2 };
		}
		default:
			return null;
	}
}

/** Where an edge attaches: the point on the node's bounding box facing `toward`. */
export function anchor(rect: Rect, toward: At): At {
	const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
	const dx = toward.x - cx, dy = toward.y - cy;
	if (dx === 0 && dy === 0) return { x: cx, y: cy };
	const sx = dx === 0 ? Infinity : rect.w / 2 / Math.abs(dx);
	const sy = dy === 0 ? Infinity : rect.h / 2 / Math.abs(dy);
	const s = Math.min(sx, sy);
	return { x: cx + dx * s, y: cy + dy * s };
}

export function centerOf(r: Rect): At { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }

/** Lowest point any node reaches in any step (incl. moved tokens and a db's caption), so short scenes need not draw a tall empty stage. */
export function contentBottom(scene: Scene): number {
	let bottom = 0;
	for (let i = 0; i < scene.steps.length; i++) {
		for (const n of stateAt(scene, i).values()) {
			const r = rectOf(n);
			if (!r) continue;
			const extra = n.kind === 'db' && n.sub ? 18 : 0;
			bottom = Math.max(bottom, r.y + r.h + extra);
		}
	}
	return bottom;
}
