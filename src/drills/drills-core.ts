// Compiles (TS → JS via sucrase) and runs learner code against a drill's tests.
// Shared by the web worker and the Node verification script.
import { transform } from 'sucrase';
import type { Drill } from './drills';

export interface DrillTestResult { name: string; passed: boolean; error?: string }
export interface DrillResult { all_passed: boolean; results: DrillTestResult[]; error_category: string | null; detail: string | null }

const deepEqual = (a: unknown, b: unknown): boolean => JSON.stringify(norm(a)) === JSON.stringify(norm(b));
// JSON.stringify drops undefined/NaN; tag them so `get()` returning undefined is distinguishable from null.
const norm = (v: any): any => (v === undefined ? '__undefined__' : Array.isArray(v) ? v.map(norm) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, norm(x)])) : v);
const show = (v: unknown) => (v === undefined ? 'undefined' : typeof v === 'string' ? JSON.stringify(v) : (() => { try { return JSON.stringify(v); } catch { return String(v); } })());

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const eq = (actual: unknown, expected: unknown) => {
	if (!deepEqual(actual, expected)) throw new Error(`expected ${show(expected)}, got ${show(actual)}`);
};
const ok = (cond: unknown, msg = 'assertion failed') => {
	if (!cond) throw new Error(msg);
};
const rejects = async (p: Promise<unknown>, contains?: string) => {
	try {
		await p;
	} catch (e: any) {
		if (contains && !String(e?.message ?? e).includes(contains)) throw new Error(`rejected with ${show(String(e?.message ?? e))}, expected message containing ${show(contains)}`);
		return;
	}
	throw new Error('expected the promise to reject, but it resolved');
};

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...a: string[]) => (...a: any[]) => Promise<void>;

export async function runDrill(drill: Drill, source: string): Promise<DrillResult> {
	let mod: Record<string, unknown>;
	try {
		const js = transform(source, { transforms: ['typescript', 'imports'] }).code;
		const exports: Record<string, unknown> = {};
		new Function('exports', 'require', js)(exports, () => ({}));
		mod = exports;
	} catch (e: any) {
		const isSyntax = e?.name === 'SyntaxError' || /Unexpected|Unterminated|Missing/.test(String(e?.message));
		return { all_passed: false, results: [], error_category: isSyntax ? 'syntax_error' : 'runtime_error', detail: String(e?.message ?? e).slice(0, 600) };
	}

	const results: DrillTestResult[] = [];
	for (const t of drill.tests) {
		try {
			await new AsyncFunction('m', 'eq', 'ok', 'rejects', 'sleep', t.body)(mod, eq, ok, rejects, sleep);
			results.push({ name: t.name, passed: true });
		} catch (e: any) {
			results.push({ name: t.name, passed: false, error: String(e?.message ?? e).slice(0, 400) });
		}
	}
	const failed = results.find((r) => !r.passed);
	return {
		all_passed: !failed,
		results,
		error_category: failed ? 'wrong_output' : null,
		detail: failed ? `${failed.name}: ${failed.error}` : null
	};
}
