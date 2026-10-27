import changelog from '../../CHANGELOG.md?raw';

const SEEN = 'preppy:whatsnew:seen';
export const appVersion: string = __APP_VERSION__;

export interface Release { version: string; date: string; summary: string; body: string }

/** The newest entry of CHANGELOG.md: the same text as the GitHub release, so "What's new" never needs separate upkeep. */
export function latestRelease(): Release | null {
	const m = changelog.match(/^## \[([^\]]+)\]\s*[—-]\s*(\S+)\n([\s\S]*?)(?=^## \[|(?![\s\S]))/m);
	if (!m) return null;
	const [summary, ...rest] = m[3].trim().split('\n\n');
	const startsWithHeading = summary.startsWith('###');
	return { version: m[1], date: m[2], summary: startsWithHeading ? '' : summary, body: (startsWithHeading ? [summary, ...rest] : rest).join('\n\n') };
}

/** True once per update: not on a fresh install (nothing of Preppy's in storage yet), and not again after it was dismissed. */
export function shouldShowWhatsNew(): boolean {
	try {
		const seen = localStorage.getItem(SEEN);
		if (seen === appVersion) return false;
		if (seen === null) {
			const existing = Object.keys(localStorage).some((k) => k.startsWith('prep-pocket:') || k.startsWith('preppy:'));
			if (!existing) { localStorage.setItem(SEEN, appVersion); return false; }
		}
		return latestRelease()?.version === appVersion;
	} catch {
		return false;
	}
}

export function markWhatsNewSeen() {
	try { localStorage.setItem(SEEN, appVersion); } catch { /* ignore */ }
}
