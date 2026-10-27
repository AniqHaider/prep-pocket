<script lang="ts">
	import { App as CapApp } from '@capacitor/app';
	import { exitAsk } from './exitState.svelte';

	const stay = () => { exitAsk.open = false; };
	const leave = () => { CapApp.exitApp(); };
</script>

{#if exitAsk.open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="scrim" role="presentation" onclick={stay}>
		<div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="exit-t" tabindex="-1" onclick={(e) => e.stopPropagation()} data-testid="exit-confirm">
			<h2 id="exit-t">Quit Preppy?</h2>
			<div class="acts">
				<button class="btn" onclick={stay} data-testid="exit-stay">Stay</button>
				<button class="btn primary" onclick={leave} data-testid="exit-quit">Quit</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.scrim { position: fixed; inset: 0; z-index: 100; background: rgba(0, 0, 0, .72); display: grid; place-items: center; padding: 24px; }
	.dlg { width: min(320px, 100%); background: var(--surface); border: 1px solid var(--control); border-radius: 16px; padding: 20px; display: grid; gap: 18px; }
	h2 { margin: 0; font-size: 18px; font-weight: 600; }
	.acts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
</style>
