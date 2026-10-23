// Starter scripts for the JavaScript / TypeScript playground. The Computer science, AI and JavaScript sections share the JS list.
export interface JsExample { label: string; code: string }

const JS: JsExample[] = [
	{ label: 'Closure counter', code: 'function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\n\nconst next = makeCounter();\nconsole.log(next(), next(), next());' },
	{ label: 'Event loop order', code: "console.log('1 sync');\nsetTimeout(() => console.log('4 timeout'), 0);\nPromise.resolve().then(() => console.log('3 microtask'));\nconsole.log('2 sync');" },
	{ label: 'map, filter, reduce', code: 'const prices = [12, 5, 30, 8, 21];\n\nconst cheap = prices.filter((p) => p < 15);\nconst withTax = prices.map((p) => +(p * 1.2).toFixed(2));\nconst total = prices.reduce((sum, p) => sum + p, 0);\n\nconsole.log(cheap);\nconsole.log(withTax);\nconsole.log({ total });' },
	{ label: 'Sort objects', code: "const people = [\n  { name: 'Chen', age: 31 },\n  { name: 'Asha', age: 27 },\n  { name: 'Ben', age: 35 }\n];\n\nconsole.log(people.toSorted((a, b) => a.age - b.age).map((p) => p.name));\nconsole.log(people.toSorted((a, b) => a.name.localeCompare(b.name)).map((p) => p.name));" },
	{ label: 'async / await', code: "const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\n\nasync function main() {\n  console.log('start');\n  await wait(300);\n  console.log('after 300 ms');\n  const results = await Promise.all([wait(100).then(() => 'a'), wait(50).then(() => 'b')]);\n  console.log(results);\n}\n\nawait main();" },
	{ label: 'Cosine similarity', code: 'const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);\nconst norm = (a) => Math.sqrt(dot(a, a));\nconst cosine = (a, b) => dot(a, b) / (norm(a) * norm(b));\n\nconsole.log(cosine([1, 0, 1], [1, 1, 0]).toFixed(3));\nconsole.log(cosine([1, 2, 3], [2, 4, 6]).toFixed(3));' }
];

const TS: JsExample[] = [
	{ label: 'Narrowing', code: "function describe(x: string | number | string[]) {\n  if (typeof x === 'string') return `text of length ${x.length}`;\n  if (Array.isArray(x)) return `list of ${x.length}`;\n  return `number ${x.toFixed(1)}`;\n}\n\nconsole.log(describe('hello'), '|', describe(3), '|', describe(['a', 'b']));" },
	{ label: 'as const', code: "const levels = ['basic', 'mid', 'advanced'] as const;\ntype Level = (typeof levels)[number];\n\nconst pick = (l: Level) => levels.indexOf(l);\nconsole.log(levels, pick('mid'));" },
	{ label: 'Enum emit', code: "enum Direction {\n  Up,\n  Down = 5,\n  Left\n}\n\n// an enum is real code: it becomes an object that maps both ways\nconsole.log(Direction);\nconsole.log(Direction.Left, Direction[5]);" },
	{ label: 'Generic function', code: "function first<T>(items: T[]): T | undefined {\n  return items[0];\n}\n\nconsole.log(first([10, 20, 30]));\nconsole.log(first(['a', 'b']));\nconsole.log(first([]));" },
	{ label: 'Type guard', code: "type Shape = { kind: 'circle'; r: number } | { kind: 'square'; side: number };\n\nconst area = (s: Shape) => (s.kind === 'circle' ? Math.PI * s.r ** 2 : s.side ** 2);\n\nconsole.log(area({ kind: 'circle', r: 2 }).toFixed(2));\nconsole.log(area({ kind: 'square', side: 3 }));" },
	{ label: 'Typed counter', code: 'function makeCounter(start: number = 0): () => number {\n  let count = start;\n  return () => ++count;\n}\n\nconst next = makeCounter(10);\nconsole.log(next(), next());' }
];

export const examplesFor = (engineId: string): JsExample[] => (engineId === 'typescript' ? TS : JS);
