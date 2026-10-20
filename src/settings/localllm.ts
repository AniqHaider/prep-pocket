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

export interface CatalogModel { id: string; label: string; file: string; url: string; bytes: number; note: string; /** rough RAM needed while loaded */ ram: string }

// Open-weights GGUF models (Q4_K_M quantization). Bigger = smarter but slower and more RAM.
export const MODEL_CATALOG: CatalogModel[] = [
	{
		id: 'qwen25-7b',
		label: 'Qwen2.5 7B Instruct',
		file: 'Qwen2.5-7B-Instruct-Q4_K_M.gguf',
		url: 'https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf',
		bytes: 4683074240,
		ram: '~6 GB',
		note: 'Best quality here: noticeably better explanations. Fits a 12 GB phone, but expect slow replies (a few words per second) and a ~1 min first load. Close other heavy apps first.'
	},
	{
		id: 'qwen25-coder-7b',
		label: 'Qwen2.5-Coder 7B Instruct',
		file: 'Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf',
		url: 'https://huggingface.co/bartowski/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf',
		bytes: 4683074336,
		ram: '~6 GB',
		note: 'Same size, tuned for code: best for the React / Next / TypeScript / Drills questions. Slightly drier prose.'
	},
	{
		id: 'qwen25-3b',
		label: 'Qwen2.5 3B Instruct',
		file: 'qwen2.5-3b-instruct-q4_k_m.gguf',
		url: 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf',
		bytes: 2104932768,
		ram: '~3 GB',
		note: 'Good speed/quality balance for a 12 GB phone: the best everyday pick.'
	},
	{
		id: 'qwen25-15b',
		label: 'Qwen2.5 1.5B Instruct',
		file: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
		url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
		bytes: 1117320736,
		ram: '~2 GB',
		note: 'Faster; handles beginner questions and quiz hints.'
	},
	{
		id: 'llama32-3b',
		label: 'Llama 3.2 3B Instruct',
		file: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
		url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
		bytes: 2019377696,
		ram: '~3 GB',
		note: 'Alternative 3B with a more conversational style.'
	},
	{
		id: 'qwen25-05b',
		label: 'Qwen2.5 0.5B Instruct',
		file: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
		url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
		bytes: 491400032,
		ram: '~1 GB',
		note: 'Tiny and fastest — good for trying it out, weak at explanations.'
	}
];

export const DEFAULT_ON_DEVICE_MODEL = MODEL_CATALOG[1].file;
export const fmtBytes = (n: number) => (n >= 1e9 ? (n / 1e9).toFixed(2) + ' GB' : (n / 1e6).toFixed(0) + ' MB');
