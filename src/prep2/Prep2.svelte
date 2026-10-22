<script lang="ts">
	import QuizView from '../quiz/QuizView.svelte';
	import { questions } from './questions/index';

	const topics = [
		{ id: 'react', label: 'React' },
		{ id: 'next', label: 'Next.js' },
		{ id: 'typescript', label: 'TypeScript' }
	];
</script>

<QuizView {questions} {topics} area="React + Next + TypeScript" storageKey="rnt-missed-v1" owner="prep2-quiz" blurb="React 19, Next.js 15/16 App Router, TypeScript, basic → advanced" />
