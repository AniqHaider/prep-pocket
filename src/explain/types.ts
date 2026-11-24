// Animated explainers are data: a stage of named nodes plus a list of steps. The renderer (Explainer.svelte)
// animates between steps, so authoring a scene never needs code. See docs/explainers.md for the authoring guide.

export type Tone = 'neutral' | 'accent' | 'warn' | 'neg';
export type Topic = 'backend' | 'postgres' | 'mysql' | 'mongodb' | 'cs' | 'ai' | 'aws' | 'javascript' | 'typescript' | 'react' | 'nextjs' | 'pyai' | 'built' | 'gcp' | 'auth' | 'apis';

interface Common {
	id: string;
	/** Starts on stage. Everything else appears when a step `show`s it. */
	visible?: boolean;
	tone?: Tone;
}
export type At = { x: number; y: number };

export type BoxNode = Common & At & { kind: 'box'; w: number; h: number; label: string; sub?: string; shape?: 'rect' | 'pill' | 'circle' | 'ring' | 'panel' };
/** A picture (a console screenshot) from `public/`. `src` is relative to the app root, e.g. `lessons/gcp/bq-results.webp`. `nw`/`nh` are the file's pixel size. `view` zooms into part of it: left/top in file pixels and the width shown (the height follows the node's aspect), settable per step so a step can zoom to the part it explains. A `box` with `shape: 'ring'` draws a highlight around a region, and `shape: 'panel'` an outlined window frame. Both are drawn behind or over other nodes on purpose, so the validator does not treat them as overlaps. */
export type ImageNode = Common & At & { kind: 'image'; src: string; w: number; h: number; nw: number; nh: number; alt?: string; view?: { x: number; y: number; w: number } };
/** A database cylinder. */
export type DbNode = Common & At & { kind: 'db'; w: number; h: number; label: string; sub?: string };
/** A table: header row + rows. `hl` lists highlighted row indexes (set per step via `set`). */
export type TableNode = Common & At & { kind: 'table'; title?: string; cols: string[]; rows: string[][]; colW?: number; hl?: number[] };
/** A JSON-ish document card. */
export type DocNode = Common & At & { kind: 'doc'; title?: string; w: number; lines: string[]; hl?: number[] };
export type TextNode = Common & At & { kind: 'text'; text: string; w?: number; size?: 'sm' | 'md' | 'lg'; anchor?: 'start' | 'middle' | 'end' };
/** A small dot or packet that `move` slides around (a request, a row, a lock). */
export type TokenNode = Common & At & { kind: 'token'; label?: string; r?: number };
/** An arrow between two nodes (by id) or points. Drawn in when shown. */
export type EdgeNode = Common & { kind: 'edge'; from: string | At; to: string | At; label?: string; dashed?: boolean };

export type SceneNode = BoxNode | DbNode | TableNode | DocNode | TextNode | TokenNode | EdgeNode | ImageNode;

export interface Step {
	/** The caption for this step: one or two plain sentences, no jargon left unexplained. */
	say: string;
	show?: string[];
	hide?: string[];
	/** Cumulative property changes, e.g. `{ t1: { hl: [2] }, b: { tone: 'warn', label: 'Locked' } }`. */
	set?: Record<string, Partial<SceneNode>>;
	/** Cumulative position changes. Tokens glide; edges attached to moved nodes follow. */
	move?: Record<string, At>;
	/** Outlined for this step only. */
	focus?: string[];
	/** Brief pulse on arrival, this step only. */
	pulse?: string[];
}

export interface Scene {
	id: string;
	topic: Topic;
	/** Backend lab chapter id (`ch1`..`ch12`) or the database topic id this belongs to. */
	group: string;
	title: string;
	/** One line: the question this scene answers. */
	blurb: string;
	/** Virtual stage size, default 360 x 300. Keep all nodes inside it. */
	stage?: { w: number; h: number };
	nodes: SceneNode[];
	steps: Step[];
}

export const STAGE_DEFAULT = { w: 360, h: 300 };
