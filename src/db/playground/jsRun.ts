// Pure runner behind the JavaScript / TypeScript playground. It runs a script as the body of an async function (so top-level
// `await` works) with an injected `console`, tracked timers and the network APIs removed. It is NOT sandboxed by itself: the
// app runs it inside a dedicated Web Worker (js.worker.ts), and bun runs it directly for the tests (scripts/verify-playground.ts).
import { transform } from 'sucrase';

export type Level = 'log' | 'info' | 'debug' | 'warn' | 'error';
export interface RunLine { level: Level; text: string }
export interface RunResult {
	lines: RunLine[];
	/** Set when the script threw, rejected, did not parse, or was stopped. `line` is the learner's own line number when it is known. */
	error?: { message: string; line?: number; stopped?: boolean };
	/** Quiet notes about how the run ended (output truncated, timers cancelled...). */
	notes: string[];
	ms: number;
}
export interface RunOpts {
	ts?: boolean;
	/** Longest the run may wait for timers / unresolved promises after the script body, from the start (default 5000). */
	timeoutMs?: number;
	maxLines?: number;
	/** Called for every line as it is produced (the Worker streams these, so output survives a terminated endless loop). */
	onLine?: (l: RunLine) => void;
}

export const NETWORK_OFF = 'Network access is turned off in the playground';
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...a: string[]) => (...a: unknown[]) => Promise<unknown>;
const BODY_OFFSET = 2; // `async function anonymous(...\n) {\n` puts the learner's line 1 on line 3 of the function source

// ───────────────────────────── value formatting (a small util.inspect) ─────────────────────────────
const IDENT = /^[A-Za-z_$][\w$]*$/;
const MAX_DEPTH = 2;
const MAX_ITEMS = 100;
const LINE_WIDTH = 72;

function quote(s: string): string {
	const q = !s.includes("'") ? "'" : !s.includes('"') ? '"' : !s.includes('`') ? '`' : "'";
	const esc = s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
	return q + (q === "'" ? esc.replace(/'/g, "\\'") : esc) + q;
}

const typeName = (v: object) => Object.prototype.toString.call(v).slice(8, -1);
const ctorName = (v: object): string | null => {
	let o: object | null = v;
	while (o) {
		const d = Object.getOwnPropertyDescriptor(o, 'constructor');
		if (d && typeof d.value === 'function' && d.value.name) return d.value.name;
		o = Object.getPrototypeOf(o);
	}
	return null;
};

function fnLabel(f: Function): string {
	const src = Function.prototype.toString.call(f);
	if (/^class[\s{]/.test(src)) return `[class ${f.name || '(anonymous)'}${Object.getPrototypeOf(f)?.name ? ` extends ${Object.getPrototypeOf(f).name}` : ''}]`;
	const kind = typeName(f);
	const base = kind === 'AsyncFunction' ? 'AsyncFunction' : kind === 'GeneratorFunction' ? 'GeneratorFunction' : kind === 'AsyncGeneratorFunction' ? 'AsyncGeneratorFunction' : 'Function';
	return f.name ? `[${base}: ${f.name}]` : `[${base} (anonymous)]`;
}

export function inspect(value: unknown, depth = 0, seen: object[] = [], top = true, refs?: Map<object, number>): string {
	if (typeof value === 'string') return top ? value : quote(value);
	if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
	if (typeof value === 'bigint') return `${value}n`;
	if (typeof value === 'boolean' || value === undefined || value === null) return String(value);
	if (typeof value === 'symbol') return value.toString();
	if (typeof value === 'function') {
		const keys = Object.keys(value);
		return keys.length && depth <= MAX_DEPTH ? `${fnLabel(value)} ${braces(keys.map((k) => `${key(k)}: ${inspect((value as any)[k], depth + 1, [...seen, value], false, refs)}`), '{', '}')}` : fnLabel(value);
	}
	return inspectObject(value as object, depth, seen, refs ?? new Map());
}

function key(k: string | symbol): string {
	return typeof k === 'symbol' ? `[${k.toString()}]` : IDENT.test(k) ? k : quote(k);
}

function braces(parts: string[], open: string, close: string, prefix = ''): string {
	if (parts.length === 0) return `${prefix}${open}${close}`;
	const one = `${prefix}${open} ${parts.join(', ')} ${close}`;
	if (one.length <= LINE_WIDTH && !parts.some((p) => p.includes('\n'))) return one;
	return `${prefix}${open}\n${parts.map((p) => '  ' + p.replace(/\n/g, '\n  ')).join(',\n')}\n${close}`;
}

function inspectObject(v: object, depth: number, seen: object[], refs: Map<object, number>): string {
	if (seen.includes(v)) {
		if (!refs.has(v)) refs.set(v, refs.size + 1);
		return `[Circular *${refs.get(v)}]`;
	}
	const tag = typeName(v);
	const name = ctorName(v);

	if (v instanceof Error) {
		const head = v.stack && v.stack.startsWith(`${v.name}`) ? `${v.name}: ${v.message}` : `${v.name}: ${v.message}`;
		const extra = Object.keys(v).filter((k) => k !== 'stack' && k !== 'message');
		const cause = (v as any).cause !== undefined ? [`[cause]: ${inspect((v as any).cause, depth + 1, [...seen, v], false, refs)}`] : [];
		const parts = [...extra.map((k) => `${key(k)}: ${inspect((v as any)[k], depth + 1, [...seen, v], false, refs)}`), ...cause];
		return parts.length ? `${head} ${braces(parts, '{', '}')}` : depth > 0 ? `[${head}]` : head;
	}
	if (v instanceof Date) return Number.isNaN(v.getTime()) ? 'Invalid Date' : v.toISOString();
	if (v instanceof RegExp) return v.toString();
	if (tag === 'Promise') return 'Promise {}';
	if (tag === 'WeakMap' || tag === 'WeakSet') return `${tag} { <items unknown> }`;
	if (tag === 'Symbol' || tag === 'Number' || tag === 'String' || tag === 'Boolean' || tag === 'BigInt') {
		const prim = (v as any).valueOf();
		return `[${tag}: ${inspect(prim, depth, seen, false, refs)}]`;
	}
	if (tag === 'ArrayBuffer') return `ArrayBuffer { byteLength: ${(v as ArrayBuffer).byteLength} }`;
	if (tag === 'Generator' || tag === 'AsyncGenerator') return `Object [${tag}] {}`;

	const next = [...seen, v];
	const sub = (x: unknown) => inspect(x, depth + 1, next, false, refs);
	let out: string;

	if (depth > MAX_DEPTH) {
		out = Array.isArray(v) ? '[Array]' : v instanceof Map ? '[Map]' : v instanceof Set ? '[Set]' : `[${name ?? 'Object'}]`;
	} else if (Array.isArray(v) || (ArrayBuffer.isView(v) && tag !== 'DataView')) {
		const arr = v as ArrayLike<unknown>;
		const parts: string[] = [];
		let holes = 0;
		const flush = () => { if (holes) { parts.push(`<${holes} empty item${holes > 1 ? 's' : ''}>`); holes = 0; } };
		const n = Math.min(arr.length, MAX_ITEMS);
		for (let i = 0; i < n; i++) {
			if (Array.isArray(v) && !(i in arr)) { holes++; continue; }
			flush();
			parts.push(sub(arr[i]));
		}
		flush();
		if (arr.length > MAX_ITEMS) parts.push(`... ${arr.length - MAX_ITEMS} more item${arr.length - MAX_ITEMS > 1 ? 's' : ''}`);
		const extra = Object.keys(v).filter((k) => !/^\d+$/.test(k));
		for (const k of extra) parts.push(`${key(k)}: ${sub((v as any)[k])}`);
		const prefix = Array.isArray(v) ? (name && name !== 'Array' ? `${name}(${arr.length}) ` : '') : `${name ?? tag}(${arr.length}) `;
		out = braces(parts, '[', ']', prefix);
	} else if (v instanceof Map) {
		const parts: string[] = [];
		let i = 0;
		for (const [k, x] of v) { if (i++ >= MAX_ITEMS) { parts.push(`... ${v.size - MAX_ITEMS} more item${v.size - MAX_ITEMS > 1 ? 's' : ''}`); break; } parts.push(`${sub(k)} => ${sub(x)}`); }
		out = braces(parts, '{', '}', `Map(${v.size}) `);
	} else if (v instanceof Set) {
		const parts: string[] = [];
		let i = 0;
		for (const x of v) { if (i++ >= MAX_ITEMS) { parts.push(`... ${v.size - MAX_ITEMS} more item${v.size - MAX_ITEMS > 1 ? 's' : ''}`); break; } parts.push(sub(x)); }
		out = braces(parts, '{', '}', `Set(${v.size}) `);
	} else {
		const parts: string[] = [];
		const keys: (string | symbol)[] = [...Object.keys(v), ...Object.getOwnPropertySymbols(v).filter((s) => Object.getOwnPropertyDescriptor(v, s)?.enumerable)];
		for (const k of keys) {
			const d = Object.getOwnPropertyDescriptor(v, k)!;
			const val = d.get || d.set ? (d.get && d.set ? '[Getter/Setter]' : d.get ? '[Getter]' : '[Setter]') : sub(d.value);
			parts.push(`${key(k)}: ${val}`);
		}
		const proto = Object.getPrototypeOf(v);
		const prefix = proto === null ? '[Object: null prototype] ' : name && name !== 'Object' ? `${name} ` : tag !== 'Object' && tag !== name ? `${tag} ` : '';
		out = braces(parts, '{', '}', prefix);
	}
	const id = refs.get(v);
	return id ? `<ref *${id}> ${out}` : out;
}

/** console.log-style formatting: printf directives in a leading string, then the remaining arguments inspected. */
export function format(args: unknown[]): string {
	if (args.length === 0) return '';
	const [first, ...rest] = args;
	let out = '';
	let used = 0;
	if (typeof first === 'string' && /%[sdifjoOc%]/.test(first)) {
		out = first.replace(/%([sdifjoOc%])/g, (m, c: string) => {
			if (c === '%') return '%';
			if (used >= rest.length) return m;
			const a = rest[used++];
			switch (c) {
				case 's': return typeof a === 'string' ? a : typeof a === 'object' && a !== null ? inspect(a, 1, [], false) : String(typeof a === 'bigint' ? `${a}n` : a);
				case 'd': return typeof a === 'bigint' ? `${a}n` : typeof a === 'object' ? 'NaN' : String(Number(a));
				case 'i': return typeof a === 'bigint' ? `${a}n` : typeof a === 'object' ? 'NaN' : String(Number.parseInt(String(a), 10));
				case 'f': return typeof a === 'symbol' ? 'NaN' : String(Number.parseFloat(String(a)));
				case 'j': try { return JSON.stringify(a); } catch { return '[Circular]'; }
				case 'o': case 'O': return inspect(a, 0, [], false);
				default: return ''; // %c: CSS, ignored
			}
		});
	} else out = inspect(first, 0, [], true);
	return [out, ...rest.slice(used).map((a) => inspect(a, 0, [], true))].join(' ');
}

function table(data: unknown): string | null {
	if (data === null || typeof data !== 'object') return null;
	const rowsIn: [string, unknown][] = Array.isArray(data) ? data.map((x, i) => [String(i), x]) : data instanceof Map ? [...data].map(([k, x], i) => [String(i), x]) : Object.entries(data);
	const cols: string[] = [];
	let hasValues = false;
	const rows = rowsIn.map(([idx, x]) => {
		const cells: Record<string, string> = {};
		if (x !== null && typeof x === 'object') for (const k of Object.keys(x)) { if (!cols.includes(k)) cols.push(k); cells[k] = inspect((x as any)[k], 1, [], false); }
		else { hasValues = true; cells['Values'] = inspect(x, 1, [], false); }
		return { idx, cells };
	});
	const heads = ['(index)', ...cols, ...(hasValues ? ['Values'] : [])];
	const body = rows.map((r) => heads.map((h, i) => (i === 0 ? r.idx : r.cells[h] ?? '')));
	const widths = heads.map((h, i) => Math.max(h.length, ...body.map((r) => r[i].length)) + 2);
	const center = (s: string, w: number) => ' '.repeat(Math.floor((w - s.length) / 2)) + s + ' '.repeat(Math.ceil((w - s.length) / 2));
	const line = (l: string, m: string, r: string) => l + widths.map((w) => '─'.repeat(w)).join(m) + r;
	return [line('┌', '┬', '┐'), '│' + heads.map((h, i) => center(h, widths[i])).join('│') + '│', line('├', '┼', '┤'), ...body.map((r) => '│' + r.map((c, i) => center(c, widths[i])).join('│') + '│'), line('└', '┴', '┘')].join('\n');
}

// ───────────────────────────────────────── the runner ─────────────────────────────────────────
// fetch returns a rejected promise like the real one (so `.catch` works); importScripts and the constructors throw, as they do when blocked
const NET_FNS = ['importScripts'];
const NET_CTORS = ['XMLHttpRequest', 'WebSocket', 'EventSource', 'WebTransport', 'Worker', 'SharedWorker'];

function lineFrom(err: unknown): number | undefined {
	const e = err as { stack?: string; line?: number };
	const m = typeof e?.stack === 'string' ? e.stack.match(/(?:<anonymous>|anonymous[^\n]*?):(\d+):\d+/) : null;
	const raw = m ? Number(m[1]) : typeof e?.line === 'number' ? e.line : undefined;
	return raw !== undefined && raw > BODY_OFFSET ? raw - BODY_OFFSET : undefined;
}

export async function runScript(source: string, opts: RunOpts = {}): Promise<RunResult> {
	const t0 = performance.now();
	const timeoutMs = opts.timeoutMs ?? 5000;
	const maxLines = opts.maxLines ?? 200;
	const lines: RunLine[] = [];
	const notes: string[] = [];
	let truncated = false;
	let error: RunResult['error'];
	const done = (): RunResult => ({ lines, error, notes, ms: Math.max(1, Math.round(performance.now() - t0)) });

	const push = (level: Level, text: string) => {
		if (lines.length >= maxLines) { truncated = true; return; }
		const l = { level, text: text.length > 4000 ? text.slice(0, 4000) + `… (${text.length - 4000} more characters)` : text };
		lines.push(l);
		opts.onLine?.(l);
	};
	const fail = (message: string, line?: number, stopped = false) => { if (!error) error = { message, line, stopped }; };

	// ---- input: imports are not available; TypeScript is stripped (never type-checked)
	if (/^\s*(import\s[^(]|import\s*\{|import\s*\*|export\s)/m.test(source)) {
		push('error', 'import and export are not available in the playground: write everything in one script.');
		fail('import and export are not available in the playground');
		return done();
	}
	let code = source;
	if (opts.ts) {
		try {
			code = transform(source, { transforms: ['typescript'], disableESTransforms: true }).code;
		} catch (e: any) {
			const m = String(e?.message ?? e);
			const loc = /\((\d+):(\d+)\)/.exec(m);
			push('error', `Syntax error: ${m.replace(/\s*\(\d+:\d+\)\s*$/, '')}${loc ? ` (line ${loc[1]})` : ''}`);
			fail(m, loc ? Number(loc[1]) : undefined);
			return done();
		}
	}

	// ---- timers: tracked, so the run can wait for them (and cancel what is left)
	const realSet = globalThis.setTimeout.bind(globalThis);
	const realSetI = globalThis.setInterval.bind(globalThis);
	const realClear = globalThis.clearTimeout.bind(globalThis);
	const realClearI = globalThis.clearInterval.bind(globalThis);
	const active = new Map<number, { real: unknown; interval: boolean }>();
	let seq = 0;
	const report = (e: unknown) => { fail(errMsg(e), lineFrom(e)); push('error', `Uncaught ${errText(e)}${lineFrom(e) ? ` (line ${lineFrom(e)})` : ''}`); };
	const schedule = (interval: boolean) => (fn: unknown, ms?: number, ...args: unknown[]) => {
		if (typeof fn !== 'function') throw new TypeError('The callback must be a function (string callbacks are not supported)');
		const id = ++seq;
		const tick = () => { if (!interval) active.delete(id); try { (fn as Function)(...args); } catch (e) { report(e); } };
		active.set(id, { real: (interval ? realSetI : realSet)(tick, ms), interval });
		return id;
	};
	const clear = (id: unknown) => { const a = active.get(id as number); if (a) { (a.interval ? realClearI : realClear)(a.real as any); active.delete(id as number); } };
	const cancelAll = () => { for (const [id] of [...active]) clear(id); };

	// ---- console
	let indent = '';
	const counts = new Map<string, number>();
	const timers = new Map<string, number>();
	const out = (level: Level) => (...a: unknown[]) => push(level, indent + format(a).replace(/\n/g, '\n' + indent));
	const cons = {
		log: out('log'), info: out('info'), debug: out('debug'), warn: out('warn'), error: out('error'),
		dir: (v: unknown) => push('log', indent + inspect(v, 0, [], false)),
		table: (d: unknown) => push('log', indent + (table(d) ?? format([d])).replace(/\n/g, '\n' + indent)),
		group: (...a: unknown[]) => { if (a.length) out('log')(...a); indent += '  '; },
		groupEnd: () => { indent = indent.slice(2); },
		assert: (c: unknown, ...a: unknown[]) => { if (!c) push('error', indent + 'Assertion failed' + (a.length ? ': ' + format(a) : '')); },
		count: (l = 'default') => { counts.set(String(l), (counts.get(String(l)) ?? 0) + 1); push('log', `${indent}${l}: ${counts.get(String(l))}`); },
		countReset: (l = 'default') => { counts.delete(String(l)); },
		time: (l = 'default') => { timers.set(String(l), performance.now()); },
		timeEnd: (l = 'default') => { const t = timers.get(String(l)); if (t !== undefined) { push('log', `${indent}${l}: ${(performance.now() - t).toFixed(3)} ms`); timers.delete(String(l)); } },
		timeLog: (l = 'default', ...a: unknown[]) => { const t = timers.get(String(l)); if (t !== undefined) push('log', `${indent}${l}: ${(performance.now() - t).toFixed(3)} ms${a.length ? ' ' + format(a) : ''}`); },
		trace: (...a: unknown[]) => push('log', `${indent}Trace${a.length ? ': ' + format(a) : ''}`),
		clear: () => { lines.length = 0; }
	};

	// ---- what the learner's code sees: tracked timers, no network, no modules
	const off = () => { throw new Error(NETWORK_OFF); };
	const overrides: Record<string, unknown> = {
		console: cons, setTimeout: schedule(false), setInterval: schedule(true), clearTimeout: clear, clearInterval: clear,
		setImmediate: (fn: unknown, ...a: unknown[]) => schedule(false)(fn, 0, ...a),
		require: () => { throw new Error('require is not available in the playground: write everything in one script.'); },
		process: undefined, module: undefined, exports: undefined
	};
	for (const n of NET_FNS) overrides[n] = off;
	overrides.fetch = () => Promise.reject(new Error(NETWORK_OFF));
	for (const n of NET_CTORS) overrides[n] = function () { off(); };
	const g = new Proxy(globalThis, {
		get: (t, k) => (typeof k === 'string' && k in overrides ? overrides[k] : Reflect.get(t, k)),
		has: (t, k) => (typeof k === 'string' && k in overrides) || Reflect.has(t, k)
	});
	for (const n of ['globalThis', 'self', 'window']) overrides[n] = g;
	const names = Object.keys(overrides);

	// ---- unhandled rejections (a rejected promise nobody awaited)
	const onRej = (e: any) => {
		const reason = e && 'reason' in e ? e.reason : e;
		fail(errMsg(reason), lineFrom(reason));
		push('error', `Uncaught (in promise) ${errText(reason)}${lineFrom(reason) ? ` (line ${lineFrom(reason)})` : ''}`);
		e?.preventDefault?.();
	};
	const proc = (globalThis as any).process;
	if (proc?.on) proc.on('unhandledRejection', onRej);
	else (globalThis as any).addEventListener?.('unhandledrejection', onRej);

	try {
		let fn: (...a: unknown[]) => Promise<unknown>;
		try {
			fn = new AsyncFunction(...names, code);
		} catch (e: any) {
			push('error', `Syntax error: ${errMsg(e)}`);
			fail(errMsg(e));
			return done();
		}
		let timedOut = false;
		let stopTimer: unknown;
		const limit = new Promise<'timeout'>((r) => { stopTimer = realSet(() => r('timeout'), timeoutMs); });
		const main = fn(...names.map((n) => overrides[n])).then(() => 'settled' as const, (e) => { report(e); return 'settled' as const; });
		timedOut = (await Promise.race([main, limit])) === 'timeout';
		if (timedOut) notes.push('Stopped after 5 s: the script was still waiting (a promise that never settles?)');
		// let the timers the script started run (the real event loop decides the order), up to the cap
		const sleep = (ms: number) => new Promise<void>((r) => realSet(r, ms));
		await sleep(0);
		while (!timedOut && active.size > 0) {
			const left = timeoutMs - (performance.now() - t0);
			if (left <= 0) { notes.push('Stopped after 5 s: timers were still pending'); break; }
			await sleep(Math.min(10, left));
		}
		await sleep(0); // one more turn so a late 'unhandledrejection' lands before we report
		await sleep(0);
		realClear(stopTimer as any);
		cancelAll();
	} finally {
		if (proc?.off) proc.off('unhandledRejection', onRej);
		else (globalThis as any).removeEventListener?.('unhandledrejection', onRej);
		cancelAll();
	}
	if (truncated) notes.push(`Output truncated at ${maxLines} lines`);
	return done();
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'string' ? e : inspect(e, 0, [], false));
const errText = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : typeof e === 'string' ? e : inspect(e, 0, [], false));
