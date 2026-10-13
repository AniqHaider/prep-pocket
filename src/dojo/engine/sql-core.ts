// Runs a learner's SQL in a fresh, disposable schema of an in-browser Postgres (PGlite).
// Port of backend/app/runner/sql_runner.py. Shared by the worker and the Node verifier.

export interface SqlResult {
	all_passed: boolean;
	rows: Record<string, unknown>[];
	error_category: string | null;
	detail: string | null;
}

// Minimal structural type for the parts of PGlite we use.
interface PGliteLike {
	exec(sql: string, opts?: any): Promise<{ rows: any[]; fields: { name: string }[] }[]>;
}

/** PGlite type OIDs we normalise so values compare equal to JSON-authored expectations. */
const T = { INT8: 20, NUMERIC: 1700, DATE: 1082, TIMESTAMP: 1114, TIMESTAMPTZ: 1184 };
export const PARSERS = {
	[T.INT8]: (v: string) => Number(v),
	[T.NUMERIC]: (v: string) => parseFloat(v),
	[T.DATE]: (v: string) => v,
	[T.TIMESTAMP]: (v: string) => v.replace(' ', 'T'),
	[T.TIMESTAMPTZ]: (v: string) => v.replace(' ', 'T')
};

export function seedStatements(sql: string): string[] {
	const body = sql
		.split('\n')
		.filter((l) => !l.trim().startsWith('--'))
		.join('\n');
	return body.split(';').map((s) => s.trim()).filter(Boolean);
}

const rowKey = (row: Record<string, unknown>) => JSON.stringify(Object.entries(row).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

export function compareRows(got: Record<string, unknown>[], expected: Record<string, unknown>[], orderSensitive: boolean): boolean {
	const g = got.map(rowKey);
	const e = expected.map(rowKey);
	if (g.length !== e.length) return false;
	if (!orderSensitive) {
		g.sort();
		e.sort();
	}
	return g.every((k, i) => k === e[i]);
}

let counter = 0;

export async function runSql(db: PGliteLike, seedSql: string, query: string, expected: Record<string, unknown>[], orderSensitive: boolean): Promise<SqlResult> {
	const schema = `ex_${Date.now().toString(36)}_${counter++}`;
	try {
		await db.exec(`CREATE SCHEMA "${schema}"; SET search_path TO "${schema}";`);
		for (const stmt of seedStatements(seedSql)) await db.exec(stmt);
		let rows: Record<string, unknown>[] = [];
		try {
			const res = await db.exec(query, { parsers: PARSERS });
			const last = res[res.length - 1];
			rows = last && last.fields.length ? last.rows : [];
		} catch (e: any) {
			return { all_passed: false, rows: [], error_category: 'sql_error', detail: String(e?.message ?? e).trim() };
		}
		if (compareRows(rows, expected, orderSensitive)) return { all_passed: true, rows, error_category: null, detail: null };
		return { all_passed: false, rows, error_category: 'wrong_result', detail: `expected ${JSON.stringify(expected)}, got ${JSON.stringify(rows)}` };
	} finally {
		try {
			await db.exec(`SET search_path TO public; DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
		} catch {
			/* ignore cleanup failures */
		}
	}
}
