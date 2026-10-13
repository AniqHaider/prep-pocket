// Port of backend/app/diagram.py: components that unlock as chapters are solved.

export interface Component {
	id: string;
	label: string;
	group: 'client' | 'application' | 'data' | 'infrastructure';
	chapter: number;
	always?: boolean;
	unlock?: 'first' | 'mid' | 'complete';
}

export const COMPONENTS: Component[] = [
	{ id: 'client', label: 'Client (browser)', group: 'client', chapter: 0, always: true },
	{ id: 'py-runtime', label: 'Python runtime', group: 'application', chapter: 1, unlock: 'first' },
	{ id: 'functions', label: 'Functions', group: 'application', chapter: 1, unlock: 'mid' },
	{ id: 'data-structures', label: 'Data structures', group: 'application', chapter: 1, unlock: 'mid' },
	{ id: 'ch1-complete-core', label: 'App core', group: 'application', chapter: 1, unlock: 'complete' },
	{ id: 'type-system', label: 'Typed models', group: 'application', chapter: 2, unlock: 'first' },
	{ id: 'async-handler', label: 'Async handler', group: 'application', chapter: 2, unlock: 'mid' },
	{ id: 'request-router', label: 'Request router', group: 'application', chapter: 2, unlock: 'complete' },
	{ id: 'rest-api', label: 'REST API', group: 'application', chapter: 5, unlock: 'first' },
	{ id: 'endpoints', label: 'Endpoints', group: 'application', chapter: 5, unlock: 'complete' },
	{ id: 'validation', label: 'Validation', group: 'application', chapter: 6, unlock: 'first' },
	{ id: 'error-handling', label: 'Error handling', group: 'application', chapter: 6, unlock: 'complete' },
	{ id: 'auth-layer', label: 'Auth layer', group: 'application', chapter: 7, unlock: 'first' },
	{ id: 'rbac', label: 'Roles & access', group: 'application', chapter: 7, unlock: 'complete' },
	{ id: 'idempotency', label: 'Idempotency', group: 'application', chapter: 8, unlock: 'complete' },
	{ id: 'postgres-db', label: 'PostgreSQL', group: 'data', chapter: 3, unlock: 'first' },
	{ id: 'tables', label: 'Tables', group: 'data', chapter: 3, unlock: 'mid' },
	{ id: 'joins-engine', label: 'Joins & queries', group: 'data', chapter: 3, unlock: 'complete' },
	{ id: 'indexes', label: 'Indexes', group: 'data', chapter: 4, unlock: 'first' },
	{ id: 'transactions', label: 'Transactions', group: 'data', chapter: 4, unlock: 'complete' },
	{ id: 'migrations', label: 'Migrations', group: 'data', chapter: 6, unlock: 'mid' },
	{ id: 'row-locks', label: 'Row locks', group: 'data', chapter: 8, unlock: 'first' },
	{ id: 'redis-cache', label: 'Redis cache', group: 'infrastructure', chapter: 9, unlock: 'first' },
	{ id: 'rate-limiter', label: 'Rate limiter', group: 'infrastructure', chapter: 9, unlock: 'complete' },
	{ id: 'task-queue', label: 'Task queue', group: 'infrastructure', chapter: 10, unlock: 'first' },
	{ id: 'worker', label: 'Background worker', group: 'infrastructure', chapter: 10, unlock: 'complete' },
	{ id: 'test-suite', label: 'Test suite', group: 'infrastructure', chapter: 11, unlock: 'first' },
	{ id: 'docker', label: 'Docker', group: 'infrastructure', chapter: 11, unlock: 'complete' },
	{ id: 'load-balancer', label: 'Load balancer', group: 'infrastructure', chapter: 12, unlock: 'first' },
	{ id: 'read-replica', label: 'Read replica', group: 'infrastructure', chapter: 12, unlock: 'complete' }
];

export function componentsToUnlock(solved: Set<string>, chapterSolved: Record<number, boolean>, chapterTotals: Record<number, number>): Set<string> {
	const counts: Record<number, number> = {};
	for (const ch of new Set(COMPONENTS.filter((c) => c.chapter > 0).map((c) => c.chapter))) {
		const prefix = `ch${ch}-`; // trailing dash so ch1- never matches ch10-
		counts[ch] = [...solved].filter((id) => id.startsWith(prefix)).length;
	}
	const out = new Set<string>();
	for (const c of COMPONENTS) {
		if (c.always) continue;
		const n = counts[c.chapter] ?? 0;
		const total = chapterTotals[c.chapter] ?? 0;
		const rule = c.unlock ?? 'first';
		if (rule === 'first' && n >= 1) out.add(c.id);
		else if (rule === 'mid' && total && n >= Math.ceil(total / 2)) out.add(c.id);
		else if (rule === 'mid' && !total && n >= 1) out.add(c.id);
		else if (rule === 'complete' && chapterSolved[c.chapter]) out.add(c.id);
	}
	return out;
}
