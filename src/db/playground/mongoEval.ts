// A safe, read-only evaluator for mongosh-style input: db.orders.find({ status: 'paid' }).sort({ _id: -1 }).limit(3)
// No eval / new Function: the text is parsed by hand and run against mingo over in-memory collections.
import { Query, Aggregator } from 'mingo';
import type { Collections, Doc } from './shop.mongo';

export class MongoInputError extends Error {}

// ---------- lenient literal parser (unquoted keys, single quotes, trailing commas, $operators) ----------
class P {
	i = 0;
	constructor(private s: string) {}
	s_peek() { return this.s[this.i]; }
	s_len() { return this.s.length; }
	ws() { while (this.i < this.s.length && /\s/.test(this.s[this.i])) this.i++; }
	fail(msg: string): never { throw new MongoInputError(`${msg} (near "${this.s.slice(Math.max(0, this.i - 12), this.i + 12).trim()}")`); }
	value(): unknown {
		this.ws();
		const c = this.s[this.i];
		if (c === undefined) return this.fail('The query ends too early, a value is missing');
		if (c === '}' || c === ')' || c === ',' || c === ']') return this.fail('A value is missing here');
		if (c === '{') return this.object();
		if (c === '[') return this.array();
		if (c === '"' || c === "'") return this.string();
		if (c === '/') return this.regex();
		if (/[-\d.]/.test(c ?? '')) return this.number();
		const word = this.ident();
		if (word === 'true') return true;
		if (word === 'false') return false;
		if (word === 'null') return null;
		if (word === 'undefined') return undefined;
		if (word === 'ISODate' || word === 'Date') { const a = this.call(); return String(a[0] ?? ''); }
		if (word === 'NumberInt' || word === 'NumberLong' || word === 'Number') return Number(this.call()[0]);
		return this.fail(word ? `I don't know "${word}" here. Use quoted text, numbers, true, false, null, arrays or objects` : 'I cannot read this character here');
	}
	call(): unknown[] {
		this.ws();
		if (this.s[this.i] !== '(') this.fail('Expected "("');
		this.i++;
		const args: unknown[] = [];
		for (;;) {
			this.ws();
			if (this.s[this.i] === ')') { this.i++; return args; }
			args.push(this.value());
			this.ws();
			if (this.s[this.i] === ',') this.i++;
			else if (this.s[this.i] !== ')') this.fail('Expected "," or ")"');
		}
	}
	ident(): string {
		const m = /^[A-Za-z_$][\w$]*/.exec(this.s.slice(this.i));
		if (!m) return '';
		this.i += m[0].length;
		return m[0];
	}
	string(): string {
		const q = this.s[this.i++];
		let out = '';
		while (this.i < this.s.length && this.s[this.i] !== q) {
			if (this.s[this.i] === '\\') { this.i++; const e = this.s[this.i++]; out += e === 'n' ? '\n' : e === 't' ? '\t' : e; }
			else out += this.s[this.i++];
		}
		if (this.s[this.i] !== q) this.fail('Unterminated string');
		this.i++;
		return out;
	}
	number(): number {
		const m = /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(this.s.slice(this.i));
		if (!m) this.fail('Bad number');
		this.i += m![0].length;
		return Number(m![0]);
	}
	regex(): RegExp {
		const m = /^\/((?:\\.|[^/\\])+)\/([gimsuy]*)/.exec(this.s.slice(this.i));
		if (!m) this.fail('Bad regular expression');
		this.i += m![0].length;
		return new RegExp(m![1], m![2]);
	}
	key(): string {
		this.ws();
		const c = this.s[this.i];
		if (c === '"' || c === "'") return this.string();
		const k = this.ident();
		if (!k) this.fail('Expected a field name');
		return k;
	}
	object(): Doc {
		this.i++;
		const o: Doc = {};
		for (;;) {
			this.ws();
			if (this.s[this.i] === '}') { this.i++; return o; }
			const k = this.key();
			this.ws();
			if (this.s[this.i] !== ':') this.fail(`Expected ":" after ${k}`);
			this.i++;
			o[k] = this.value();
			this.ws();
			if (this.s[this.i] === ',') this.i++;
			else if (this.s[this.i] !== '}') this.fail('Expected "," or "}"');
		}
	}
	array(): unknown[] {
		this.i++;
		const a: unknown[] = [];
		for (;;) {
			this.ws();
			if (this.s[this.i] === ']') { this.i++; return a; }
			a.push(this.value());
			this.ws();
			if (this.s[this.i] === ',') this.i++;
			else if (this.s[this.i] !== ']') this.fail('Expected "," or "]"');
		}
	}
}

const WRITES = ['insertOne', 'insertMany', 'updateOne', 'updateMany', 'replaceOne', 'deleteOne', 'deleteMany', 'drop', 'createIndex', 'dropIndex', 'findOneAndUpdate', 'findOneAndDelete', 'findOneAndReplace', 'bulkWrite', 'renameCollection', 'remove', 'save'];

export type MongoResult = { kind: 'docs'; docs: Doc[]; total: number } | { kind: 'value'; value: unknown };

/** Runs one mongosh-style statement against `data`. Throws MongoInputError with a plain-words message. */
export function runMongo(input: string, data: Collections): MongoResult {
	let src = input.trim().replace(/;+\s*$/, '');
	if (!src) throw new MongoInputError('Type a query first, for example: db.orders.find({ status: "paid" })');
	if (/^show\s+(collections|tables)$/i.test(src)) return { kind: 'value', value: Object.keys(data) };
	if (!src.startsWith('db.')) throw new MongoInputError('Start with db.<collection>, for example db.orders.find({})');
	src = src.slice(3);
	const p = new P(src);
	const head = p.ident();
	if (head === 'getCollectionNames') { p.call(); return { kind: 'value', value: Object.keys(data) }; }
	if (p.s_peek() !== '.') p.fail('Expected a method, like db.orders.find(...)');
	p.i++;
	const method = p.ident();
	if (WRITES.includes(method)) throw new MongoInputError(`"${method}" changes data. This playground is read-only so the sample shop stays the same for everyone. Try find, aggregate, countDocuments or distinct.`);
	const coll = data[head];
	if (!coll) throw new MongoInputError(`No collection named "${head}". The sample shop has: ${Object.keys(data).join(', ')}.`);
	const args = p.call();
	const docs = coll.map((d) => structuredClone(d));
	const resolver = (name: string) => (data[name] ?? []).map((d) => structuredClone(d));

	let cursor: { filter: Doc; projection?: Doc; sort?: Doc; skip: number; limit: number; one: boolean } | null = null;
	let result: MongoResult | null = null;
	switch (method) {
		case 'find': cursor = { filter: (args[0] as Doc) ?? {}, projection: args[1] as Doc | undefined, skip: 0, limit: 0, one: false }; break;
		case 'findOne': cursor = { filter: (args[0] as Doc) ?? {}, projection: args[1] as Doc | undefined, skip: 0, limit: 1, one: true }; break;
		case 'aggregate': {
			if (!Array.isArray(args[0])) throw new MongoInputError('aggregate needs a pipeline array, like db.orders.aggregate([{ $match: {} }])');
			try {
				const out = new Aggregator(args[0] as Doc[], { collectionResolver: resolver }).run(docs) as Doc[];
				result = { kind: 'docs', docs: out, total: out.length };
			} catch (e) { throw new MongoInputError(String((e as Error).message ?? e)); }
			break;
		}
		case 'countDocuments': result = { kind: 'value', value: new Query((args[0] as Doc) ?? {}).find(docs).all().length }; break;
		case 'estimatedDocumentCount': result = { kind: 'value', value: docs.length }; break;
		case 'distinct': {
			const field = String(args[0] ?? '');
			const out = new Set<unknown>();
			for (const d of new Query((args[1] as Doc) ?? {}).find(docs).all()) {
				const v = field.split('.').reduce<any>((o, k) => (o == null ? o : o[k]), d);
				(Array.isArray(v) ? v : [v]).forEach((x) => x !== undefined && out.add(x));
			}
			result = { kind: 'value', value: [...out].sort() };
			break;
		}
		default: throw new MongoInputError(`"${method}" isn't supported here. Use find, findOne, aggregate, countDocuments, estimatedDocumentCount or distinct.`);
	}

	// chained cursor methods
	let asCount = false;
	while (cursor && (p.ws(), p.s_peek() === '.')) {
		p.i++;
		const m = p.ident();
		const a = p.call();
		if (m === 'sort') cursor.sort = a[0] as Doc;
		else if (m === 'limit') cursor.limit = Number(a[0]);
		else if (m === 'skip') cursor.skip = Number(a[0]);
		else if (m === 'project') cursor.projection = a[0] as Doc;
		else if (m === 'count') asCount = true;
		else if (m === 'toArray' || m === 'pretty') { /* already an array */ }
		else throw new MongoInputError(`".${m}()" isn't supported. Chain sort, limit, skip, project, count or toArray.`);
	}
	p.ws();
	if (p.i < p.s_len()) p.fail('Unexpected text after the query');
	if (cursor) {
		try {
			let c = new Query(cursor.filter).find(docs, cursor.projection);
			if (cursor.sort) c = c.sort(cursor.sort);
			const all = c.all() as Doc[];
			if (asCount) return { kind: 'value', value: all.length };
			const page = (all as Doc[]).slice(cursor.skip, cursor.limit ? cursor.skip + cursor.limit : undefined);
			return cursor.one ? { kind: 'value', value: page[0] ?? null } : { kind: 'docs', docs: page, total: page.length };
		} catch (e) { throw new MongoInputError(String((e as Error).message ?? e)); }
	}
	if (p.s_len() > p.i) p.fail('Unexpected text after the query');
	return result!;
}
