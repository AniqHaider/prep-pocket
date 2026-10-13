// JS side of the on-device LLM (Android plugin "LocalLlm", llama.cpp CPU inference).
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface LocalModel { file: string; bytes: number; complete: boolean }

export interface LocalLlmPlugin {
	listModels(): Promise<{ models: LocalModel[]; loaded: string | null; freeBytes: number }>;
	download(o: { url: string; file: string }): Promise<{ file: string; bytes: number }>;
	cancelDownload(): Promise<void>;
	deleteModel(o: { file: string }): Promise<{ deleted: boolean }>;
	load(o: { file: string }): Promise<{ loaded: string; system?: string }>;
	unload(): Promise<void>;
	stop(): Promise<void>;
	generate(o: { system: string; user: string; maxTokens?: number; temperature?: number }): Promise<{ text: string; tokens: number; tokensPerSec: number }>;
	addListener(event: 'token', fn: (e: { text: string }) => void): Promise<PluginListenerHandle>;
	addListener(event: 'downloadProgress', fn: (e: { file: string; received: number; total: number }) => void): Promise<PluginListenerHandle>;
}

export const LocalLlm = registerPlugin<LocalLlmPlugin>('LocalLlm');

/** True only inside the Android app (the plugin doesn't exist in a normal browser). */
export const onDeviceAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalLlm');

export interface CatalogModel { id: string; label: string; file: string; url: string; bytes: number; note: string }

// Open-weights GGUF models (Q4_K_M quantization). Bigger = smarter but slower and more RAM.
export const MODEL_CATALOG: CatalogModel[] = [
	{
		id: 'qwen25-3b',
		label: 'Qwen2.5 3B Instruct',
		file: 'qwen2.5-3b-instruct-q4_k_m.gguf',
		url: 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf',
		bytes: 2104932768,
		note: 'Smartest option here — good fit for a 12 GB phone. Slower replies.'
	},
	{
		id: 'qwen25-15b',
		label: 'Qwen2.5 1.5B Instruct',
		file: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
		url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
		bytes: 1117320736,
		note: 'Balanced: noticeably faster, still handles beginner backend questions.'
	},
	{
		id: 'llama32-3b',
		label: 'Llama 3.2 3B Instruct',
		file: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
		url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
		bytes: 2019377696,
		note: 'Alternative 3B with a more conversational style.'
	},
	{
		id: 'qwen25-05b',
		label: 'Qwen2.5 0.5B Instruct',
		file: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
		url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
		bytes: 491400032,
		note: 'Tiny and fastest — good for trying it out, weak at explanations.'
	}
];

export const DEFAULT_ON_DEVICE_MODEL = MODEL_CATALOG[1].file;
export const fmtBytes = (n: number) => (n >= 1e9 ? (n / 1e9).toFixed(2) + ' GB' : (n / 1e6).toFixed(0) + ' MB');
