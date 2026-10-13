// Tutor/LLM settings, stored on-device only (localStorage). Keys never leave the phone except
// in requests to the provider the user picked.
export type Provider = 'none' | 'gemini' | 'anthropic' | 'openai-compatible';

export interface TutorSettings {
	provider: Provider;
	apiKey: string;
	model: string;
	/** For openai-compatible servers, e.g. Ollama on the Mac: http://192.168.1.20:11434/v1 */
	baseUrl: string;
}

export const DEFAULT_MODELS: Record<Provider, string> = {
	none: '',
	gemini: 'gemini-2.5-flash',
	anthropic: 'claude-haiku-5-5',
	'openai-compatible': 'llama3.2'
};

const KEY = 'prep-pocket:tutor-settings:v1';

export function loadSettings(): TutorSettings {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		if (raw && typeof raw === 'object') return { provider: 'none', apiKey: '', model: '', baseUrl: '', ...raw };
	} catch {
		/* ignore */
	}
	return { provider: 'none', apiKey: '', model: '', baseUrl: '' };
}

export function saveSettings(s: TutorSettings) {
	try {
		localStorage.setItem(KEY, JSON.stringify(s));
	} catch {
		/* ignore */
	}
}
