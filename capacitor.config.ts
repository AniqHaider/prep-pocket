import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.aniqhaider.preppocket',
	appName: 'Preppy',
	webDir: 'dist',
	backgroundColor: '#0b0f16',
	server: {
		// http://localhost origin (still a secure context) so the tutor can reach a local LLM server
		// such as Ollama over plain-HTTP on the LAN; https origins would block that as mixed content.
		androidScheme: 'http',
		cleartext: true
	},
	android: { allowMixedContent: true },
	plugins: { SystemBars: { style: 'DARK' } }
};

export default config;
