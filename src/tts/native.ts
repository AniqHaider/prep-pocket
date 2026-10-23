// JS side of the on-device narration voices (Android plugin "LocalTts": sherpa-onnx, Kokoro / Piper).
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { loadTtsPrefs } from './prefs';

export interface InstalledVoice { id: string; installed: boolean; partialBytes: number }
export interface SynthResult {
	/** Base64 WAV. Absent when the request asked for `noAudio` (prefetch). */
	wav?: string;
	sampleRate: number;
	audioSec: number;
	/** Seconds of CPU spent synthesizing. 0 for a cache hit. */
	synthSec: number;
	rms: number;
	/** True when the audio came from the cache: it says nothing about how fast this phone synthesizes. */
	cached: boolean;
}
export interface SynthOptions {
	text: string;
	sid?: number;
	speed?: number;
	/** The voice this request is for: the plugin rejects it if another voice is loaded by then (never caches the wrong voice). */
	voice?: string;
	/** SHA-256 hex from cacheKey(): look in the cache first and store the result. */
	key?: string;
	/** Bypass the cache both ways (speed tests need real synthesis). */
	nocache?: boolean;
	/** Do not send the audio back (prefetch only fills the cache). */
	noAudio?: boolean;
	/** Queue behind anything the learner is waiting for. */
	low?: boolean;
}
export interface CpuInfo { cores: number; performance: number; freqsMhz: number[]; freqsKnown: boolean; defaultThreads: number }
export interface CacheStats { bytes: number; files: number; limitBytes: number }

export interface LocalTtsPlugin {
	listVoices(): Promise<{ voices: InstalledVoice[]; loaded: string | null; freeBytes: number }>;
	download(o: { id: string; url: string }): Promise<{ id: string }>;
	cancelDownload(): Promise<void>;
	deleteVoice(o: { id: string }): Promise<{ deleted: boolean }>;
	load(o: { id: string; threads?: number }): Promise<{ loaded: string; speakers: number; threads: number }>;
	unload(): Promise<void>;
	synthesize(o: SynthOptions): Promise<SynthResult>;
	cacheHas(o: { keys: string[] }): Promise<{ has: boolean[] }>;
	cacheStats(): Promise<CacheStats>;
	clearCache(): Promise<void>;
	setCacheLimit(o: { mb?: number; bytes?: number }): Promise<CacheStats>;
	cancelPrefetch(): Promise<void>;
	cpuInfo(): Promise<CpuInfo>;
	addListener(event: 'downloadProgress', fn: (e: { id: string; phase: 'download' | 'extract'; received: number; total: number }) => void): Promise<PluginListenerHandle>;
}

export const LocalTts = registerPlugin<LocalTtsPlugin>('LocalTts');

/** True only inside the Android app (the plugin doesn't exist in a normal browser). */
export const neuralAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalTts');

let cpu: Promise<CpuInfo> | null = null;
/** CPU layout, read once. */
export function getCpuInfo(): Promise<CpuInfo> {
	return (cpu ??= LocalTts.cpuInfo());
}

/** Threads for a voice: the one found by "Find fastest setting", else the performance cores (at most 4, at least 2). */
export async function threadsFor(id: string): Promise<number> {
	const tuned = loadTtsPrefs().threads?.[id]?.threads;
	if (tuned) return tuned;
	try { return (await getCpuInfo()).defaultThreads; } catch { return 4; }
}

let loadedKey: string | null = null;
/** Loads a voice (with its thread count) into memory once; later calls for the same voice and threads are free. */
export async function ensureLoaded(id: string) {
	const threads = await threadsFor(id);
	const key = `${id}:${threads}`;
	if (loadedKey === key) return;
	await LocalTts.load({ id, threads });
	loadedKey = key;
}
export function forgetLoaded() { loadedKey = null; }

export function wavToBuffer(b64: string): ArrayBuffer {
	const bin = atob(b64);
	const u = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
	return u.buffer;
}
