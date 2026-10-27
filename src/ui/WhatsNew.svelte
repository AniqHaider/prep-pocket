<script lang="ts">
	import { marked } from 'marked';
	import { latestRelease, markWhatsNewSeen, shouldShowWhatsNew } from './whatsNew';

	const rel = latestRelease();
	let open = $state(shouldShowWhatsNew());

	function close() { markWhatsNewSeen(); open = false; }
	const html = (md: string) => marked.parse(md, { async: false }) as string;
</script>

{#if open && rel}
	<div class="scrim" role="presentation">
		<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="wn-t" data-testid="whats-new">
			<small class="v">Version {rel.version}</small>
			<h2 id="wn-t">What's new</h2>
			{#if rel.summary}<p class="sum">{rel.summary}</p>{/if}
			<div class="body">{@html html(rel.body)}</div>
			<button class="btn primary" onclick={close} data-testid="whats-new-ok">Got it</button>
		</div>
	</div>
{/if}

<style>
	.scrim { position: fixed; inset: 0; z-index: 110; background: rgba(0, 0, 0, .72); display: grid; place-items: center; padding: 20px; }
	.dlg { width: min(420px, 100%); max-height: 86dvh; background: var(--surface); border: 1px solid var(--control); border-radius: 16px; padding: 20px; display: grid; grid-template-rows: auto auto auto 1fr auto; gap: 10px; }
	.v { color: var(--faint); }
	h2 { margin: 0; font-size: 20px; font-weight: 600; }
	.sum { margin: 0; color: var(--muted); }
	.body { overflow-y: auto; min-height: 0; font-size: 14px; line-height: 1.5; }
	.body :global(h3) { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--faint); margin: 12px 0 6px; font-weight: 600; }
	.body :global(ul) { margin: 0; padding-left: 18px; display: grid; gap: 8px; }
	.body :global(p) { margin: 0 0 8px; }
</style>
