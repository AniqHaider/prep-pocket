// Starter stubs and reference solutions, bundled as raw text.
const stubs = import.meta.glob('./stubs/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const refs = import.meta.glob('./ref/solutions/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export const starterFor = (file: string) => stubs[`./stubs/${file}.ts`] ?? '';
export const referenceFor = (file: string) => refs[`./ref/solutions/${file}.ts`] ?? '';
