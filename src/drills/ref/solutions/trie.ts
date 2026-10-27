interface Node { kids: Map<string, Node>; end: boolean }
const mk = (): Node => ({ kids: new Map(), end: false });

export class Trie {
	private root = mk();
	insert(word: string): void {
		let n = this.root;
		for (const ch of word) {
			if (!n.kids.has(ch)) n.kids.set(ch, mk());
			n = n.kids.get(ch)!;
		}
		n.end = true;
	}
	private find(s: string): Node | null {
		let n = this.root;
		for (const ch of s) {
			const nx = n.kids.get(ch);
			if (!nx) return null;
			n = nx;
		}
		return n;
	}
	search(word: string): boolean {
		return this.find(word)?.end ?? false;
	}
	startsWith(prefix: string): boolean {
		return this.find(prefix) !== null;
	}
	suggest(prefix: string, limit = 5): string[] {
		const start = this.find(prefix);
		const out: string[] = [];
		if (!start) return out;
		const dfs = (n: Node, acc: string) => {
			if (out.length >= limit) return;
			if (n.end) out.push(acc);
			for (const ch of [...n.kids.keys()].sort()) dfs(n.kids.get(ch)!, acc + ch);
		};
		dfs(start, prefix);
		return out;
	}
}
