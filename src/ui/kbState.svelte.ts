// Which keyboard the code editors use, and which editor the in-app keyboard is currently typing into.
import { EditorView } from '@codemirror/view';
import { deleteCharBackward, cursorCharLeft, cursorCharRight, cursorLineUp, cursorLineDown, insertNewlineAndIndent, indentMore, undo } from '@codemirror/commands';

export type KbMode = 'app' | 'phone';
const KEY = 'preppy:codekeyboard';

function loadMode(): KbMode {
	try { return localStorage.getItem(KEY) === 'phone' ? 'phone' : 'app'; } catch { return 'app'; }
}

export const kb = $state({ mode: loadMode() as KbMode, target: null as KbTarget | null, collapsed: false });

export function setKbMode(m: KbMode) {
	kb.mode = m;
	kb.collapsed = false;
	try { localStorage.setItem(KEY, m); } catch { /* not remembered */ }
}

/** What the keyboard can do to whichever editor has focus. */
export interface KbTarget {
	el: HTMLElement;
	insert(text: string): void;
	backspace(): void;
	left(): void;
	right(): void;
	up(): void;
	down(): void;
	enter(): void;
	tab(): void;
	undo(): void;
}

const INDENT = '  ';

/** A plain <textarea>: edits go through execCommand so the browser's own undo stack keeps working and bound values update. */
function textareaTarget(el: HTMLTextAreaElement): KbTarget {
	const put = (t: string) => {
		if (!document.execCommand('insertText', false, t)) {
			el.setRangeText(t, el.selectionStart, el.selectionEnd, 'end');
			el.dispatchEvent(new Event('input', { bubbles: true }));
		}
	};
	const lineInfo = () => {
		const v = el.value, p = el.selectionStart;
		const start = v.lastIndexOf('\n', p - 1) + 1;
		return { v, p, start, line: v.slice(start, p) };
	};
	const move = (to: number) => el.setSelectionRange(to, to);
	return {
		el,
		insert: put,
		backspace() {
			if (el.selectionStart !== el.selectionEnd) { document.execCommand('delete'); return; }
			if (el.selectionStart === 0) return;
			if (!document.execCommand('delete')) {
				el.setRangeText('', el.selectionStart - 1, el.selectionStart, 'end');
				el.dispatchEvent(new Event('input', { bubbles: true }));
			}
		},
		left() { move(Math.max(0, el.selectionStart - (el.selectionStart !== el.selectionEnd ? 0 : 1))); },
		right() { move(Math.min(el.value.length, el.selectionEnd + (el.selectionStart !== el.selectionEnd ? 0 : 1))); },
		up() {
			const { v, p, start } = lineInfo();
			if (start === 0) return move(0);
			const prevStart = v.lastIndexOf('\n', start - 2) + 1;
			move(Math.min(prevStart + (p - start), start - 1));
		},
		down() {
			const { v, p, start } = lineInfo();
			const nl = v.indexOf('\n', p);
			if (nl === -1) return move(v.length);
			const nextEnd = v.indexOf('\n', nl + 1);
			move(Math.min(nl + 1 + (p - start), nextEnd === -1 ? v.length : nextEnd));
		},
		enter() {
			// keep the indentation of the line above, and add a level after an opening bracket or colon
			const { line } = lineInfo();
			const ind = /^[ \t]*/.exec(line)![0];
			const opens = /[{(\[:]\s*$/.test(line);
			put('\n' + ind + (opens ? INDENT : ''));
		},
		tab() { put(INDENT); },
		undo() { document.execCommand('undo'); }
	};
}

function codeMirrorTarget(view: EditorView): KbTarget {
	const run = (cmd: (v: EditorView) => boolean) => { cmd(view); view.focus(); };
	return {
		el: view.contentDOM,
		insert(t) { view.dispatch(view.state.replaceSelection(t), { userEvent: 'input.type', scrollIntoView: true }); },
		backspace: () => run(deleteCharBackward),
		left: () => run(cursorCharLeft),
		right: () => run(cursorCharRight),
		up: () => run(cursorLineUp),
		down: () => run(cursorLineDown),
		enter: () => run(insertNewlineAndIndent),
		tab: () => run(indentMore),
		undo: () => run(undo)
	};
}

/** Finds the editor a focused element belongs to, or null when it isn't a code editor (chat boxes and settings keep the phone keyboard). */
export function targetFor(el: Element | null): KbTarget | null {
	if (!el) return null;
	if (el instanceof HTMLTextAreaElement && el.dataset.codekb !== undefined) return textareaTarget(el);
	const host = el.closest?.('.cm-editor');
	if (host) {
		const view = EditorView.findFromDOM(host as HTMLElement);
		if (view) return codeMirrorTarget(view);
	}
	return null;
}

/** Svelte action for a code <textarea>: opts it into the in-app keyboard and hides the phone keyboard while that is chosen. */
export function codeinput(node: HTMLTextAreaElement) {
	node.dataset.codekb = '';
	$effect(() => {
		node.inputMode = kb.mode === 'app' ? 'none' : 'text';
	});
}
