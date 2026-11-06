// Looks things up in Preppy's own content (topic notes and quiz explanations) so the assistant can answer from
// the app instead of a small model's memory. Everything runs on the phone, offline: a BM25 index over short
// chunks, built the first time a question is asked.
import { postgres } from '../db/postgres';
import { mysql } from '../db/mysql';
import { mongodb } from '../db/mongodb';
import { cs } from '../db/cs';
import { ai } from '../db/ai';
import { aws } from '../db/aws';
import { javascript } from '../db/javascript';
import { typescript } from '../db/typescript';
import { react } from '../db/react';
import { nextjs } from '../db/nextjs';
import { interview } from '../db/interview';
import { pyai } from '../db/pyai';
import { built } from '../db/built';
import type { LearnEngine } from '../db/types';

export interface KnowledgeHit {
	/** e.g. "AI and agents · Model Context Protocol" */
	label: string;
	text: string;
	score: number;
}

export interface KnowledgeResult {
	hits: KnowledgeHit[];
	/** Highest score found (0 when nothing relevant). Used to decide whether the web is worth asking. */
	best: number;
}

interface Chunk {
	label: string;
	text: string;
	tf: Map<string, number>;
	len: number;
	weight: number;
	/** The opening chunk of a topic: its summary and first paragraphs, i.e. the definition. */
	first: boolean;
}

const ENGINES: LearnEngine[] = [ai, pyai, cs, aws, javascript, typescript, react, nextjs, postgres, mysql, mongodb, interview, built];

export const STOP = new Set(
	('a an and are as at be but by can could do does did for from had has have how i if in into is it its me my of on or our so than that the their them then there these they this to up us was we were what when where which who why will with would you your ' +
		'about explain tell give show please simple simply mean means meaning define definition difference between vs versus use used using work works working example examples hint code question answer wrong right ' +
		'might may should must concept concepts behind tempting option options hello hi hey thanks thank okay ok help topic section following above below review edge case cases quiz').split(' ')
);

/** Lowercase words and numbers; drops filler words and trims a plural "s" so "tokens" matches "token". */
export function tokenize(s: string): string[] {
	const out: string[] = [];
	for (const w of s.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
		if (STOP.has(w) || (w.length < 2 && !/\d/.test(w))) continue;
		out.push(w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
	}
	return out;
}

const MAX_CHUNK = 650;

/** Splits markdown notes into blocks of whole paragraphs (a fenced code block stays in one piece). */
function chunkNotes(notes: string): string[] {
	const blocks: string[] = [];
	let cur: string[] = [];
	let fence = false;
	const flush = () => {
		if (cur.join('\n').trim()) blocks.push(cur.join('\n').trim());
		cur = [];
	};
	for (const line of notes.split('\n')) {
		if (line.trimStart().startsWith('```')) fence = !fence;
		if (!fence && !line.trim() && !line.startsWith('```')) flush();
		else cur.push(line);
	}
	flush();
	const out: string[] = [];
	let acc = '';
	for (const b of blocks) {
		if (acc && acc.length + b.length > MAX_CHUNK) {
			out.push(acc);
			acc = '';
		}
		acc = acc ? acc + '\n\n' + b : b;
	}
	if (acc) out.push(acc);
	return out;
}

let index: { chunks: Chunk[]; df: Map<string, number>; firstOf: Map<string, Chunk> } | null = null;

function build() {
	const chunks: Chunk[] = [];
	const firstOf = new Map<string, Chunk>();
	const add = (label: string, title: string, text: string, weight: number, first = false) => {
		const tf = new Map<string, number>();
		// The title counts double, so asking about a topic by name finds all of its chunks.
		for (const w of [...tokenize(title), ...tokenize(title), ...tokenize(text)]) tf.set(w, (tf.get(w) ?? 0) + 1);
		let len = 0;
		for (const n of tf.values()) len += n;
		const chunk = { label, text, tf, len, weight, first };
		chunks.push(chunk);
		if (first) firstOf.set(label, chunk);
	};
	for (const e of ENGINES) {
		for (const t of e.topics) {
			const label = `${e.name} · ${t.title}`;
			const parts = chunkNotes(t.notes);
			parts.forEach((p, i) => add(label, t.title, (i === 0 ? t.summary + '\n\n' : '') + p, 1, i === 0));
		}
		const topicTitle = new Map(e.quizTopics.map((q) => [q.id, q.label]));
		for (const q of e.questions) {
			const label = `${e.name} · ${topicTitle.get(q.topic) ?? q.topic}`;
			add(label, q.tag, `${q.q}\nAnswer: ${q.correct}\n${q.why}`, 0.85);
		}
	}
	const df = new Map<string, number>();
	for (const c of chunks) for (const w of c.tf.keys()) df.set(w, (df.get(w) ?? 0) + 1);
	return { chunks, df, firstOf };
}

const K1 = 1.4;
const B = 0.75;

/**
 * Finds the passages of Preppy that best match `question`.
 * Returns nothing for questions with no distinctive word ("give me a hint"), so generic chat is not padded with noise.
 */
export function searchKnowledge(question: string, opts: { maxChars?: number; maxHits?: number } = {}): KnowledgeResult {
	const maxChars = opts.maxChars ?? 1700;
	const maxHits = opts.maxHits ?? 3;
	index ??= build();
	const { chunks, df, firstOf } = index;
	const N = chunks.length;
	const q = [...new Set(tokenize(question))];
	if (!q.length) return { hits: [], best: 0 };
	const idf = (w: string) => Math.log(1 + (N - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));
	// A distinctive word appears in under ~6% of chunks; if the question has none, there is nothing worth looking up.
	const known = q.filter((w) => df.has(w));
	if (!known.some((w) => (df.get(w) ?? 0) / N <= 0.06)) return { hits: [], best: 0 };
	const avg = chunks.reduce((n, c) => n + c.len, 0) / N;
	const queryMass = known.reduce((n, w) => n + idf(w), 0);

	const scored: (KnowledgeHit & { first: boolean })[] = [];
	for (const c of chunks) {
		let score = 0;
		let matched = 0;
		for (const w of known) {
			const f = c.tf.get(w);
			if (!f) continue;
			matched += idf(w);
			score += (idf(w) * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * c.len) / avg));
		}
		if (!score) continue;
		// Chunks that contain most of the question's rare words beat chunks that repeat one of them.
		const coverage = matched / queryMass;
		if (coverage < 0.5) continue;
		scored.push({ label: c.label, text: c.text, score: score * c.weight * (0.5 + coverage), first: c.first });
	}
	scored.sort((a, b) => b.score - a.score);

	// Start from the definition: when the best match is a later chunk of a topic, put that topic's opening chunk first.
	const top = scored[0];
	const opening = top && !top.first ? firstOf.get(top.label) : undefined;
	if (opening && !scored.some((h) => h.text === opening.text)) scored.unshift({ label: opening.label, text: opening.text, score: top.score, first: true });
	else if (opening) {
		const i = scored.findIndex((h) => h.text === opening.text);
		if (i > 0 && scored[i].score > top.score * 0.35) scored.unshift(...scored.splice(i, 1));
	}

	const hits: KnowledgeHit[] = [];
	const perLabel = new Map<string, number>();
	let used = 0;
	for (const h of scored) {
		if ((perLabel.get(h.label) ?? 0) >= 2) continue;
		const room = maxChars - used;
		if (room < 200) break;
		const text = h.text.length > room ? h.text.slice(0, room).replace(/\s+\S*$/, '') + '…' : h.text;
		hits.push({ ...h, text });
		perLabel.set(h.label, (perLabel.get(h.label) ?? 0) + 1);
		used += text.length;
		if (hits.length >= maxHits) break;
	}
	return { hits, best: scored[0]?.score ?? 0 };
}
