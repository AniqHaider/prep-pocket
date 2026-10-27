<script lang="ts">
	// One outline icon set (24px grid, 1.6 stroke, round caps). Decorative by default; pass `label` to expose it.
	type Name =
		| 'menu' | 'close' | 'back' | 'chevron' | 'dojo' | 'frontend' | 'react' | 'drills' | 'settings'
		| 'sparkle' | 'flame' | 'check' | 'send' | 'stop' | 'trash' | 'book' | 'mic' | 'layers' | 'database' | 'alert' | 'play' | 'pause' | 'replay' | 'visual' | 'table' | 'braces' | 'cpu' | 'bot' | 'cloud' | 'js' | 'shield' | 'component' | 'next' | 'briefcase' | 'home' | 'python';
	let { name, size = 18, label = '' }: { name: Name; size?: number; label?: string } = $props();
	const P: Record<Name, string> = {
		menu: 'M4 7h16M4 12h16M4 17h16',
		close: 'M6 6l12 12M18 6L6 18',
		back: 'M15 5l-7 7 7 7',
		chevron: 'M9 5l7 7-7 7',
		dojo: 'M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14',
		frontend: 'M4 5h16v11H4zM9 20h6M12 16v4',
		react: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
		drills: 'M13 3L5 14h6l-1 7 8-11h-6z',
		settings: 'M5 7h9M18 7h1M5 17h1M10 17h9M16 5v4M8 15v4',
		sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
		flame: 'M12 3c1 3.2 4.5 5.2 4.5 9.5A4.5 4.5 0 0 1 12 17a4.5 4.5 0 0 1-4.5-4.5c0-1.7.8-3 1.8-4 .2 1.4.9 2.1 1.7 2.4C11 8.8 10.8 5.8 12 3zM9.5 21h5',
		check: 'M5 12.5l4.5 4.5L19 7.5',
		send: 'M5 12h13M13 6l6 6-6 6',
		stop: 'M7 7h10v10H7z',
		trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
		book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
		mic: 'M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v3',
		layers: 'M12 4l9 5-9 5-9-5zM3 14l9 5 9-5',
		database: 'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6',
		alert: 'M12 4l9 16H3zM12 10v4M12 17.2v.1',
		play: 'M8 5l11 7-11 7z',
		pause: 'M8 5v14M16 5v14',
		replay: 'M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4',
		visual: 'M4 5h16v14H4zM10 9l5 3-5 3z',
		table: 'M4 5h16v14H4zM4 10h16M10 5v14',
		cpu: 'M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM10 10h4v4h-4z',
		cloud: 'M7 18a4 4 0 0 1-.6-7.95A5.6 5.6 0 0 1 17 8.6 4.7 4.7 0 0 1 17.4 18z',
		bot: 'M12 3v3M8 6h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM9.5 11v1.5M14.5 11v1.5M9 15.5h6M3 11v3M21 11v3',
		js: 'M4 4h16v16H4zM11.5 10v5.2a1.6 1.6 0 0 1-3 .6M14.3 16.7c.4.8 1.1 1.1 1.9 1.1 1 0 1.6-.5 1.6-1.3 0-2.1-3.4-1-3.4-3.1 0-.8.7-1.4 1.7-1.4.7 0 1.3.2 1.7.8',
		briefcase: 'M3 8h18v11H3zM9 8V5h6v3M3 13h18',
		home: 'M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-6h4v6',
		python: 'M12 3c-3 0-4.5 1-4.5 3v2.5h4.8V10H5.5C3.8 10 3 11.5 3 13.5s.8 3.5 2.5 3.5H7v-2.5c0-1.7 1.4-3 3-3h4c1.4 0 2.5-1.1 2.5-2.5V6c0-1.5-1.6-3-4.5-3zM12 21c3 0 4.5-1 4.5-3v-2.5h-4.8V14h6.8c1.7 0 2.5-1.5 2.5-3.5S20.2 7 18.5 7H17v2.5c0 1.7-1.4 3-3 3h-4A2.5 2.5 0 0 0 7.5 15v3c0 1.5 1.6 3 4.5 3z',
		shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
		component: 'M12 3l3 3-3 3-3-3zM6 9l3 3-3 3-3-3zM18 9l3 3-3 3-3-3zM12 15l3 3-3 3-3-3z',
		next: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 16V8l6 8.2V8',
		braces: 'M9 4C7 4 6 5 6 7v2c0 1-1.5 3-3 3 1.5 0 3 2 3 3v2c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2c0 1 1.5 3 3 3-1.5 0-3 2-3 3v2c0 2-1 3-3 3'
	};
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
	role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'} focusable="false">
	<path d={P[name]} />
</svg>
