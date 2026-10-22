<script lang="ts">
	// One outline icon set (24px grid, 1.6 stroke, round caps). Decorative by default; pass `label` to expose it.
	type Name =
		| 'menu' | 'close' | 'back' | 'chevron' | 'dojo' | 'frontend' | 'react' | 'drills' | 'settings'
		| 'sparkle' | 'flame' | 'check' | 'send' | 'stop' | 'trash' | 'book' | 'mic' | 'layers' | 'database' | 'alert' | 'play' | 'pause';
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
		pause: 'M8 5v14M16 5v14'
	};
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
	role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'} focusable="false">
	<path d={P[name]} />
</svg>
