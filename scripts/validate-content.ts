// Validates animated scenes and database content: `bun run content` (everything), or `bun run content pg-` / `bun run content postgres`
// (that engine's scenes AND its topics/quiz). Backend scenes: `bun run content be-`.
import { allScenes } from '../src/explain/registry';
import { stateAt, rectOf, wrapText, charsFor } from '../src/explain/layout';
import { STAGE_DEFAULT } from '../src/explain/types';
import type { Scene, SceneNode } from '../src/explain/types';
import { postgres } from '../src/db/postgres';
import { mysql } from '../src/db/mysql';
import { mongodb } from '../src/db/mongodb';
import { cs } from '../src/db/cs';
import { ai } from '../src/db/ai';
import { aws } from '../src/db/aws';
import { javascript } from '../src/db/javascript';
import { typescript } from '../src/db/typescript';
import { react } from '../src/db/react';
import { nextjs } from '../src/db/nextjs';
import { interview } from '../src/db/interview';
import { pyai } from '../src/db/pyai';

const filter = process.argv[2] ?? '';
const errs: string[] = [];
const warns: string[] = [];
const E = (where: string, msg: string) => errs.push(`${where}: ${msg}`);
const W = (where: string, msg: string) => warns.push(`${where}: ${msg}`);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u;
const engines = { postgres, mysql, mongodb, cs, ai, aws, javascript, typescript, react, nextjs, interview, pyai };
const PREFIX = { postgres: 'pg-', mysql: 'my-', mongodb: 'mg-', cs: 'cs-', ai: 'ai-', aws: 'aw-', javascript: 'js-', typescript: 'ts-', react: 'rc-', nextjs: 'nx-', interview: 'iv-', pyai: 'pa-' } as const; // scene id prefix per engine
const CH = new Set(Array.from({ length: 12 }, (_, i) => `ch${i + 1}`));

// ---------- scenes ----------
const seen = new Set<string>();
for (const s of allScenes) {
	if (filter && !s.id.startsWith(filter)) continue;
	const at = `scene ${s.id}`;
	if (seen.has(s.id)) E(at, 'duplicate scene id');
	seen.add(s.id);
	if (s.title.length > 42) E(at, `title too long (${s.title.length} > 42)`);
	if (s.blurb.length < 20 || s.blurb.length > 110) W(at, `blurb length ${s.blurb.length} (aim 20-110)`);
	if (s.topic === 'backend' ? !CH.has(s.group) : !engines[s.topic].topics.some((t) => t.id === s.group)) E(at, `group "${s.group}" is not a ${s.topic === 'backend' ? 'chapter id ch1..ch12' : 'topic id of ' + s.topic}`);
	if (s.steps.length < 4 || s.steps.length > 12) W(at, `${s.steps.length} steps (aim 5-10)`);
	checkScene(s, at);
}

function checkScene(s: Scene, at: string) {
	const st = s.stage ?? STAGE_DEFAULT;
	const ids = new Set<string>();
	for (const n of s.nodes) {
		if (ids.has(n.id)) E(at, `duplicate node id ${n.id}`);
		ids.add(n.id);
	}
	const ref = (id: string, where: string) => { if (!ids.has(id)) E(at, `${where} references unknown node "${id}"`); };
	for (const n of s.nodes) {
		if (n.kind === 'edge') {
			if (typeof n.from === 'string') ref(n.from, `edge ${n.id}.from`);
			if (typeof n.to === 'string') ref(n.to, `edge ${n.id}.to`);
		}
		const r = rectOf(n);
		if (r && (r.x < -1 || r.y < -1 || r.x + r.w > st.w + 1 || r.y + r.h > st.h + 1)) E(at, `node ${n.id} outside the ${st.w}x${st.h} stage (${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}x${Math.round(r.h)})`);
		if (n.kind === 'box' || n.kind === 'db') {
			const lines = wrapText(n.label, charsFor(n.w));
			const sub = n.sub ? wrapText(n.sub, charsFor(n.w, 10.5)) : [];
			const need = lines.length * 15 + (sub.length ? sub.length * 13 + 2 : 0) + 6;
			if (n.kind === 'box' && (n.label || n.sub) && need > n.h) E(at, `box ${n.id} text needs ${need}px but h=${n.h} ("${n.label}")`);
			const longest = Math.max(...n.label.split(/\s+/).map((w) => w.length));
			if (longest > charsFor(n.w)) E(at, `box ${n.id} word of ${longest} chars does not fit width ${n.w}`);
		}
		if (n.kind === 'table') {
			const cw = n.colW ?? 62;
			for (const row of n.rows) {
				if (row.length !== n.cols.length) E(at, `table ${n.id} row has ${row.length} cells, expected ${n.cols.length}`);
				row.forEach((c, i) => { if (c.length * 6 > cw - 6) W(at, `table ${n.id} cell "${c}" may not fit colW ${cw}`); });
			}
		}
		if (n.kind === 'doc') n.lines.forEach((l) => { if (l.length * 6.3 > n.w - 14) E(at, `doc ${n.id} line "${l}" is wider than the card (w=${n.w})`); });
	}
	s.steps.forEach((step, i) => {
		const w = `${at} step ${i + 1}`;
		if (!step.say || step.say.length < 30) E(w, 'caption too short');
		if (step.say.length > 190) E(w, `caption ${step.say.length} chars (max 190)`);
		if (EMOJI.test(step.say)) E(w, 'emoji in caption');
		const touched = [step.show, step.hide, step.focus, step.pulse].some((a) => a?.length) || (step.set && Object.keys(step.set).length) || (step.move && Object.keys(step.move).length);
		if (!touched) W(w, 'step changes nothing on screen');
		for (const k of ['show', 'hide', 'focus', 'pulse'] as const) step[k]?.forEach((id) => ref(id, `${k}`));
		step.move && Object.keys(step.move).forEach((id) => ref(id, 'move'));
		step.set && Object.keys(step.set).forEach((id) => ref(id, 'set'));
		// overlap check on what is visible after this step
		const state = stateAt(s, i);
		const vis = [...state.values()].filter((n) => n.shown && n.kind !== 'edge' && n.kind !== 'token' && n.kind !== 'text');
		for (let a = 0; a < vis.length; a++)
			for (let b = a + 1; b < vis.length; b++) {
				const ra = rectOf(vis[a])!, rb = rectOf(vis[b])!;
				const ox = Math.min(ra.x + ra.w, rb.x + rb.w) - Math.max(ra.x, rb.x), oy = Math.min(ra.y + ra.h, rb.y + rb.h) - Math.max(ra.y, rb.y);
				if (ox > 3 && oy > 3) E(w, `${vis[a].id} overlaps ${vis[b].id}`);
			}
		// edge labels must fit beside / above their arrow
		for (const n of state.values()) {
			if (n.kind !== 'edge' || !n.shown || !n.label) continue;
			const f = typeof n.from === 'string' ? state.get(n.from) : null, t = typeof n.to === 'string' ? state.get(n.to) : null;
			const rf = f ? rectOf(f) : null, rt = t ? rectOf(t) : null;
			if (rf && rt) {
				const gapX = Math.max(rt.x - (rf.x + rf.w), rf.x - (rt.x + rt.w)), gapY = Math.max(rt.y - (rf.y + rf.h), rf.y - (rt.y + rt.h));
				const vertical = gapY > gapX;
				const need = n.label.length * 6.2;
				if (!vertical && need > Math.max(gapX, 0) + 4) W(w, `edge ${n.id} label "${n.label}" (${Math.round(need)}px) is wider than the ${Math.round(gapX)}px gap`);
				if (vertical && gapY < 22) W(w, `edge ${n.id} is only ${Math.round(gapY)}px long`);
			}
		}
	});
}

// ---------- database content ----------
for (const eng of Object.values(engines)) {
	if (filter && !eng.id.startsWith(filter) && !PREFIX[eng.id].startsWith(filter) && !filter.startsWith(PREFIX[eng.id])) continue;
	const at = `db ${eng.id}`;
	const topicIds = new Set(eng.topics.map((t) => t.id));
	eng.topics.forEach((t) => {
		if (EMOJI.test(t.notes + t.title + t.summary)) E(`${at}/${t.id}`, 'emoji');
		const words = t.notes.split(/\s+/).length;
		if (words < 70 || words > 320) W(`${at}/${t.id}`, `notes ${words} words (aim 120-220)`);
		t.scenes.forEach((sid) => { if (!allScenes.some((s) => s.id === sid)) E(`${at}/${t.id}`, `unknown scene id ${sid}`); });
		allScenes.filter((s) => s.topic === eng.id && s.group === t.id).forEach((s) => { if (!t.scenes.includes(s.id)) W(`${at}/${t.id}`, `scene ${s.id} is in this group but not listed in topic.scenes`); });
	});
	const qids = new Set<string>();
	const quizTopicIds = new Set(eng.quizTopics.map((t) => t.id));
	let longest = 0;
	for (const q of eng.questions) {
		const w = `${at}/${q.id}`;
		if (qids.has(q.id)) E(w, 'duplicate id'); qids.add(q.id);
		if (!quizTopicIds.has(q.topic)) E(w, `topic "${q.topic}" not in quizTopics`);
		const opts = [q.correct, ...q.wrong];
		if (new Set(opts.map((o) => o.trim())).size !== 4) E(w, 'options are not 4 distinct strings');
		if (opts.some((o) => /all of the above|none of the above|both a and b/i.test(o))) E(w, 'all/none of the above');
		if (/\b(option|answer|choice)\s+[A-D]\b|\b[A-D]\)/.test(q.why + q.q)) E(w, 'refers to a letter (options are shuffled)');
		if (q.why.length < 80) E(w, `explanation too short (${q.why.length})`);
		if (q.q.length < 20) E(w, 'question too short');
		if (EMOJI.test(q.q + q.why + opts.join(''))) E(w, 'emoji');
		if (opts.every((o) => q.correct.length >= o.length)) longest++;
	}
	if (eng.questions.length && longest / eng.questions.length > 0.4) W(at, `correct answer is the longest option in ${Math.round((longest / eng.questions.length) * 100)}% of questions (aim < 30%): vary lengths`);
	const ratio = (lv: string) => eng.questions.filter((q) => q.level === lv).length;
	console.log(`${eng.id}: ${eng.topics.length} topics, ${eng.questions.length} questions (basic ${ratio('basic')}, mid ${ratio('mid')}, advanced ${ratio('advanced')}), ${new Set(eng.topics.flatMap((t) => t.scenes)).size} scenes linked`);
}

console.log(`scenes: ${allScenes.filter((s) => !filter || s.id.startsWith(filter)).length} checked`);
warns.forEach((m) => console.log('WARN ', m));
errs.forEach((m) => console.log('ERROR', m));
console.log(errs.length ? `FAIL: ${errs.length} errors, ${warns.length} warnings` : `OK: 0 errors, ${warns.length} warnings`);
process.exit(errs.length ? 1 : 0);
