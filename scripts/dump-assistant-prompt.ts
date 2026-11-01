// Prints the exact (system, user) prompt the assistant would send for a question, so it can be tried against a
// model on a computer (llama-completion, Ollama) without the phone.
//   bun scripts/dump-assistant-prompt.ts "What is MCP?"            -> JSON {system, user, sources}
//   bun scripts/dump-assistant-prompt.ts "What is MCP?" --plain    -> the same prompt without notes (the old behaviour)
import { buildPrompt, systemPrompt } from '../src/assistant/prompt';
import { searchKnowledge } from '../src/assistant/knowledge';

const args = process.argv.slice(2);
const plain = args.includes('--plain');
const question = args.filter((a) => !a.startsWith('--')).join(' ');
const notes = plain ? { hits: [] } : searchKnowledge(question);
const user = buildPrompt(question, null, [], { notes: notes.hits, web: [] });
const system = systemPrompt({ context: false, notes: notes.hits.length > 0, web: false });
console.log(JSON.stringify({ system, user, sources: notes.hits.map((h) => h.label) }));
