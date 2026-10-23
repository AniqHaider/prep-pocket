// The key under which a synthesized sentence is cached on the phone. Pure and shared by the player and the tests: the same
// voice + speaker + speed + exact text always gives the same key, and changing any one of them gives a different key.
// Native code only stores and looks up files by this key (it never computes it), so there is one definition.

/** Canonical text that is hashed. Speed is rounded to 2 decimals so 1, 1.0 and 1.001 are one entry. */
export function cacheKeyInput(voice: string, sid: number, speed: number, text: string): string {
	const sp = (Math.round(speed * 100) / 100).toFixed(2);
	// voice ids and speaker ids have a fixed shape, and the text comes last, so the fields can not run into one another
	return `${voice}|${Math.trunc(sid)}|${sp}|${text}`;
}

/** SHA-256 hex of the canonical input (WebCrypto: available in the app WebView, which is a secure context, and in Bun). */
export async function cacheKey(voice: string, sid: number, speed: number, text: string): Promise<string> {
	const bytes = new TextEncoder().encode(cacheKeyInput(voice, sid, speed, text));
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
