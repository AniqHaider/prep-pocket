// Downloadable narration voices (sherpa-onnx release "tts-models", int8 builds so they stay small and fast).
export interface VoiceSpeaker { sid: number; label: string }
export interface CatalogVoice {
	id: string;
	label: string;
	engine: 'kokoro' | 'piper';
	url: string;
	bytes: number;
	note: string;
	/** Kokoro ships many speakers in one download; Piper voices are a single speaker. */
	speakers?: VoiceSpeaker[];
}

const BASE = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/';

export const VOICES: CatalogVoice[] = [
	{
		id: 'kokoro-int8-multi-lang-v1_0',
		label: 'Natural (best)',
		engine: 'kokoro',
		url: BASE + 'kokoro-int8-multi-lang-v1_0.tar.bz2',
		bytes: 132303094,
		note: 'Kokoro 82M: the most human-sounding option, with 5 English speakers to choose from. Heaviest; it may pause between sentences on slower phones.',
		speakers: [
			{ sid: 3, label: 'Heart (US, female)' },
			{ sid: 2, label: 'Bella (US, female)' },
			{ sid: 11, label: 'Adam (US, male)' },
			{ sid: 21, label: 'Emma (UK, female)' },
			{ sid: 26, label: 'George (UK, male)' }
		]
	},
	{
		id: 'vits-piper-en_US-lessac-high-int8',
		label: 'Clear (US, high quality)',
		engine: 'piper',
		url: BASE + 'vits-piper-en_US-lessac-high-int8.tar.bz2',
		bytes: 35022847,
		note: 'Piper "Lessac" high: a steady, clear American voice. Good quality with modest CPU use.'
	},
	{
		id: 'vits-piper-en_US-hfc_female-medium-int8',
		label: 'Warm (US, female)',
		engine: 'piper',
		url: BASE + 'vits-piper-en_US-hfc_female-medium-int8.tar.bz2',
		bytes: 21021379,
		note: 'Piper "HFC female" medium: small and fast, softer than the system voice.'
	},
	{
		id: 'vits-piper-en_GB-alan-medium-int8',
		label: 'British (male)',
		engine: 'piper',
		url: BASE + 'vits-piper-en_GB-alan-medium-int8.tar.bz2',
		bytes: 21103831,
		note: 'Piper "Alan" medium: small and fast British male voice.'
	}
];

export const SAMPLE_TEXT = 'A backend is the program that runs on a server. When your app calls fetch, it receives the request and sends a response back.';
