import type { Scene, SceneNode } from '../../types';

/** Gradient descent chart: loss = w * w drawn as 17 thin bars for w = -4 .. 4 in steps of 0.5. Baseline y = 250. */
const lossBar = (i: number): SceneNode => {
	const w = -4 + i * 0.5;
	const h = Math.max(3, 12 * w * w);
	return { id: `lb${i}`, kind: 'box', x: 10 + i * 20, y: 250 - h, w: 18, h, label: '', visible: true };
};
/** Ball centre for a weight value w (sits on top of the curve). */
const ballX = (w: number) => Math.round(179 + 40 * w);
const ballY = (w: number) => Math.round(250 - 12 * w * w - 8);

/** Overfitting chart: groups of two bars (train, validation), 4px per error unit, baseline y = 250. */
const TRAIN = [40, 28, 18, 9, 2];
const VAL = [42, 30, 22, 31, 45];
const DEG = ['1', '2', '4', '8', '15'];
const trainBar = (i: number): SceneNode => ({ id: `tr${i}`, kind: 'box', x: 24 + 64 * i, y: 250 - 4 * TRAIN[i], w: 24, h: 4 * TRAIN[i], label: '' });
const valBar = (i: number): SceneNode => ({ id: `va${i}`, kind: 'box', x: 50 + 64 * i, y: 250 - 4 * VAL[i], w: 24, h: 4 * VAL[i], label: '', tone: 'accent' });
const degLabel = (i: number): SceneNode => ({ id: `dg${i}`, kind: 'text', x: 49 + 64 * i, y: 266, text: DEG[i], anchor: 'middle', size: 'sm' });

/** Train/test split: 20 row tiles in two rows of ten. */
const tile = (i: number): SceneNode => ({ id: `r${i}`, kind: 'box', x: 20 + 32 * (i % 10), y: 70 + 34 * Math.floor(i / 10), w: 30, h: 26, label: String(i + 1) });
const SHUFFLED = [7, 15, 3, 12, 20, 1, 9, 18, 5, 14, 2, 11, 17, 8, 19, 4, 13, 10, 6, 16];
const TEST_POS = [3, 8, 12, 17];

/** Cross-validation grid: 5 rounds x 5 folds. */
const SCORES = ['0.84', '0.88', '0.81', '0.86', '0.86'];
const foldCell = (r: number, c: number): SceneNode => ({
	id: `f${r}${c}`,
	kind: 'box',
	x: 62 + 48 * c,
	y: 52 + 38 * r,
	w: 44,
	h: 30,
	label: r === c ? 'val' : 'train',
	tone: r === c ? 'accent' : 'neutral'
});
const roundShow = (r: number): string[] => [`rl${r}`, `sc${r}`, ...[0, 1, 2, 3, 4].map((c) => `f${r}${c}`)];

/** Foundations of Python for AI engineering: the library map, NumPy, pandas, scikit-learn workflow, and the idea of learning from data. */
export const paFoundations: Scene[] = [
	// ───────── pa-roadmap ─────────
	{
		id: 'pa-ml-map',
		topic: 'pyai',
		group: 'pa-roadmap',
		title: 'How the AI libraries stack up',
		blurb: 'Which library sits on which, from Python to an LLM app?',
		nodes: [
			{ id: 'l1', kind: 'box', x: 10, y: 6, w: 180, h: 36, label: 'Python', sub: 'the glue language' },
			{ id: 'e12', kind: 'edge', from: 'l1', to: 'l2' },
			{ id: 'l2', kind: 'box', x: 10, y: 56, w: 180, h: 36, label: 'NumPy', sub: 'n-dimensional arrays' },
			{ id: 'e23', kind: 'edge', from: 'l2', to: 'l3' },
			{ id: 'l3', kind: 'box', x: 10, y: 106, w: 180, h: 36, label: 'pandas, scikit-learn', sub: 'tables, classic ML' },
			{ id: 'e34', kind: 'edge', from: 'l3', to: 'l4' },
			{ id: 'l4', kind: 'box', x: 10, y: 156, w: 180, h: 36, label: 'PyTorch', sub: 'tensors, autograd, GPU' },
			{ id: 'e45', kind: 'edge', from: 'l4', to: 'l5' },
			{ id: 'l5', kind: 'box', x: 10, y: 206, w: 180, h: 36, label: 'Hugging Face', sub: 'pretrained models' },
			{ id: 'e56', kind: 'edge', from: 'l5', to: 'l6' },
			{ id: 'l6', kind: 'box', x: 10, y: 256, w: 180, h: 36, label: 'LLM apps', sub: 'RAG, agents, APIs' },
			{ id: 't1', kind: 'text', x: 204, y: 28, text: 'you write all of it', size: 'sm' },
			{ id: 't2', kind: 'text', x: 204, y: 78, text: 'array math at C speed', size: 'sm' },
			{ id: 't3', kind: 'text', x: 204, y: 128, text: 'clean data, fit models', size: 'sm' },
			{ id: 't4', kind: 'text', x: 204, y: 178, text: 'neural nets on a GPU', size: 'sm' },
			{ id: 't5', kind: 'text', x: 204, y: 228, text: 'download, then fine-tune', size: 'sm' },
			{ id: 't6', kind: 'text', x: 204, y: 278, text: 'what users actually see', size: 'sm' }
		],
		steps: [
			{ say: 'Everything starts with Python, a readable glue language. The heavy maths is not done by Python itself but by libraries written in C, C++ and CUDA.', show: ['l1', 't1'], focus: ['l1'] },
			{ say: 'NumPy provides the n-dimensional array. Almost every other library stores its numbers in arrays like this, so it is the shared foundation.', show: ['e12', 'l2', 't2'], focus: ['l2'] },
			{ say: 'pandas wraps arrays in labelled tables for cleaning data. scikit-learn trains classic models such as linear models and trees on those arrays.', show: ['e23', 'l3', 't3'], focus: ['l3'] },
			{ say: 'PyTorch has its own array type, the tensor, which can run on a GPU and compute gradients automatically. That is how neural networks learn.', show: ['e34', 'l4', 't4'], focus: ['l4'] },
			{ say: 'Hugging Face packages thousands of pretrained models, mostly built on PyTorch, so you can download one instead of training from scratch.', show: ['e45', 'l5', 't5'], focus: ['l5'] },
			{ say: 'On top sit applications: search over your documents (RAG), agents and APIs. Many only call a hosted model, so you can start at this layer.', show: ['e56', 'l6', 't6'], focus: ['l6'] },
			{ say: 'Shape errors, slow code and bad data are lower-layer problems. The better you know the layers below your app, the faster you debug it.', set: { l6: { tone: 'accent' } }, pulse: ['l2', 'l4', 'l6'] }
		]
	},

	// ───────── pa-numpy ─────────
	{
		id: 'pa-broadcasting',
		topic: 'pyai',
		group: 'pa-numpy',
		title: 'Broadcasting: shapes that stretch',
		blurb: 'How can NumPy add a (3, 1) array to a (1, 4) array?',
		nodes: [
			{ id: 'a', kind: 'table', x: 10, y: 10, title: 'a, shape (3, 1)', cols: ['a'], rows: [['10'], ['20'], ['30']], colW: 40 },
			{ id: 'b', kind: 'table', x: 190, y: 10, title: 'b, shape (1, 4)', cols: ['0', '1', '2', '3'], rows: [['1', '2', '3', '4']], colW: 40 },
			{ id: 'plus', kind: 'text', x: 180, y: 68, text: '+', size: 'lg', anchor: 'middle' },
			{ id: 'cmp', kind: 'text', x: 180, y: 150, text: '3 vs 1 -> 3    1 vs 4 -> 4', size: 'sm', anchor: 'middle' },
			{ id: 'a2', kind: 'table', x: 10, y: 10, title: 'a stretched (3, 4)', cols: ['a', 'a', 'a', 'a'], rows: [['10', '10', '10', '10'], ['20', '20', '20', '20'], ['30', '30', '30', '30']], colW: 40 },
			{ id: 'b2', kind: 'table', x: 190, y: 10, title: 'b stretched (3, 4)', cols: ['0', '1', '2', '3'], rows: [['1', '2', '3', '4'], ['1', '2', '3', '4'], ['1', '2', '3', '4']], colW: 40 },
			{ id: 'res', kind: 'table', x: 80, y: 168, title: 'a + b, shape (3, 4)', cols: ['0', '1', '2', '3'], rows: [['11', '12', '13', '14'], ['21', '22', '23', '24'], ['31', '32', '33', '34']], colW: 50 }
		],
		steps: [
			{ say: 'a is a column with shape (3, 1) and b is a row with shape (1, 4). The shapes differ, so adding them looks impossible.', show: ['a', 'b', 'plus'] },
			{ say: 'NumPy compares shapes from the right. Two sizes are compatible if they are equal or one of them is 1. Here 3 vs 1 gives 3, and 1 vs 4 gives 4.', show: ['cmp'], focus: ['a', 'b'] },
			{ say: 'a has size 1 along its second axis, so it is stretched across 4 columns: each row repeats its value. NumPy does this virtually, without copying data.', hide: ['a'], show: ['a2'], focus: ['a2'] },
			{ say: 'b has size 1 along its first axis, so it is stretched down 3 rows: every row becomes 1, 2, 3, 4.', hide: ['b'], show: ['b2'], focus: ['b2'] },
			{ say: 'Both are now (3, 4), so the addition runs element by element: 10 + 1 = 11, 10 + 2 = 12, 20 + 1 = 21, and so on.', show: ['res'], focus: ['res'] },
			{ say: 'One line of code, no loops, and a full (3, 4) grid of sums. This is how you add a bias vector to every row of a batch.', set: { res: { hl: [0, 1, 2] }, cmp: { tone: 'accent' } }, pulse: ['res'] },
			{ say: 'If shapes cannot line up, such as (3,) with (4,), NumPy raises a ValueError instead of guessing. Read the shapes in the message first.', set: { cmp: { text: '(3,) + (4,): 3 vs 4 -> error', tone: 'neg' } }, focus: ['cmp'] }
		]
	},
	{
		id: 'pa-vectorize',
		topic: 'pyai',
		group: 'pa-numpy',
		title: 'Vectorising: loop vs one array call',
		blurb: 'Why is data.sum() far faster than a Python for loop?',
		nodes: [
			{ id: 'dl', kind: 'doc', x: 10, y: 10, w: 165, title: 'Python loop', lines: ['total = 0', 'for x in data:', '    total += x'] },
			{ id: 'dv', kind: 'doc', x: 185, y: 10, w: 165, title: 'NumPy', lines: ['total = data.sum()'] },
			{ id: 'c1', kind: 'box', x: 14, y: 110, w: 32, h: 30, label: '1' },
			{ id: 'c2', kind: 'box', x: 50, y: 110, w: 32, h: 30, label: '2' },
			{ id: 'c3', kind: 'box', x: 86, y: 110, w: 32, h: 30, label: '3' },
			{ id: 'c4', kind: 'box', x: 122, y: 110, w: 32, h: 30, label: '4' },
			{ id: 'd1', kind: 'box', x: 194, y: 110, w: 32, h: 30, label: '1' },
			{ id: 'd2', kind: 'box', x: 230, y: 110, w: 32, h: 30, label: '2' },
			{ id: 'd3', kind: 'box', x: 266, y: 110, w: 32, h: 30, label: '3' },
			{ id: 'd4', kind: 'box', x: 302, y: 110, w: 32, h: 30, label: '4' },
			{ id: 'tok', kind: 'token', x: 30, y: 125, label: '' },
			{ id: 'acc', kind: 'text', x: 14, y: 172, text: 'total = 0', size: 'md' },
			{ id: 'accv', kind: 'text', x: 194, y: 172, text: 'total = 10', size: 'md' },
			{ id: 'bl', kind: 'box', x: 10, y: 206, w: 165, h: 50, label: 'One Python step per item', sub: 'type checks every time', tone: 'warn' },
			{ id: 'bv', kind: 'box', x: 185, y: 206, w: 165, h: 50, label: 'One call, compiled loop', sub: 'tight C over raw memory', tone: 'accent' }
		],
		steps: [
			{ say: 'The same job two ways: add up four numbers. First the plain Python loop, which most of us would write by habit.', show: ['dl', 'c1', 'c2', 'c3', 'c4', 'acc'] },
			{ say: 'The loop picks up the first item. Python checks its type, finds the + operation, runs it and stores the result, one item at a time.', show: ['tok'], set: { acc: { text: 'total = 1' } }, focus: ['c1'] },
			{ say: 'Next item: the same checks happen again. total is now 1 + 2 = 3.', move: { tok: { x: 66, y: 125 } }, set: { acc: { text: 'total = 3' } }, focus: ['c2'] },
			{ say: 'Third item: total becomes 6. With a million items, that bookkeeping repeats a million times.', move: { tok: { x: 102, y: 125 } }, set: { acc: { text: 'total = 6' } }, focus: ['c3'] },
			{ say: 'Last item: total is 10. The answer is right, but most of the time went on interpreter overhead, not on adding.', move: { tok: { x: 138, y: 125 } }, set: { acc: { text: 'total = 10' } }, focus: ['c4'] },
			{ say: 'data.sum() hands the whole array to compiled code. It loops over one contiguous block of memory of a single dtype, with no per-item Python work.', show: ['dv', 'd1', 'd2', 'd3', 'd4', 'accv'], pulse: ['d1', 'd2', 'd3', 'd4'] },
			{ say: 'Same answer, far less overhead. Rule of thumb: if you write a for loop over array elements, look for the array operation that does it in one call.', show: ['bl', 'bv'], focus: ['bv'] }
		]
	},

	// ───────── pa-pandas ─────────
	{
		id: 'pa-groupby',
		topic: 'pyai',
		group: 'pa-pandas',
		title: 'groupby: split, apply, combine',
		blurb: 'What does df.groupby(...).sum() do step by step?',
		nodes: [
			{ id: 'code', kind: 'text', x: 10, y: 20, text: 'df.groupby("city")["amount"].sum()', size: 'sm' },
			{
				id: 'src',
				kind: 'table',
				x: 10,
				y: 36,
				title: 'orders',
				cols: ['city', 'amount'],
				rows: [['Pune', '100'], ['Delhi', '250'], ['Pune', '150'], ['Delhi', '50'], ['Mumbai', '300']],
				colW: 70
			},
			{ id: 'gp', kind: 'table', x: 190, y: 36, title: 'group: Pune', cols: ['city', 'amount'], rows: [['Pune', '100'], ['Pune', '150']], colW: 70 },
			{ id: 'gd', kind: 'table', x: 190, y: 126, title: 'group: Delhi', cols: ['city', 'amount'], rows: [['Delhi', '250'], ['Delhi', '50']], colW: 70 },
			{ id: 'gm', kind: 'table', x: 190, y: 216, title: 'group: Mumbai', cols: ['city', 'amount'], rows: [['Mumbai', '300']], colW: 70 },
			{ id: 'res', kind: 'table', x: 190, y: 36, title: 'result: one row per city', cols: ['city', 'sum'], rows: [['Delhi', '300'], ['Mumbai', '300'], ['Pune', '250']], colW: 70 },
			{ id: 'more', kind: 'text', x: 190, y: 170, text: 'Swap sum for mean, count, max, or agg(["sum", "count"]).', size: 'sm', w: 160 }
		],
		steps: [
			{ say: 'An orders table. We want the total amount per city. In SQL this is GROUP BY, and pandas follows the same idea.', show: ['code', 'src'] },
			{ say: 'Split: rows with the same key go into a group. Pune appears in rows 0 and 2, so those two rows form the Pune group.', show: ['gp'], set: { src: { hl: [0, 2] } } },
			{ say: 'Delhi sits in rows 1 and 3, so those rows form the Delhi group. The original table is not changed.', show: ['gd'], set: { src: { hl: [1, 3] } } },
			{ say: 'Mumbai has a single row. Every row of the table now belongs to exactly one group.', show: ['gm'], set: { src: { hl: [4] } } },
			{
				say: 'Apply: the function runs on each group separately. Pune 100 + 150 = 250, Delhi 250 + 50 = 300, Mumbai 300.',
				set: { src: { hl: [] }, gp: { title: 'Pune: sum = 250', tone: 'accent' }, gd: { title: 'Delhi: sum = 300', tone: 'accent' }, gm: { title: 'Mumbai: sum = 300', tone: 'accent' } }
			},
			{ say: 'Combine: the per-group answers are stitched into a new table with one row per key. Keys come out sorted by default.', hide: ['gp', 'gd', 'gm'], show: ['res'], pulse: ['res'] },
			{ say: 'The pattern is the same for any summary. Pick the key, pick the column, pick the function, and pandas does split, apply and combine.', show: ['more'], focus: ['more'] }
		]
	},

	// ───────── pa-math-for-ml ─────────
	{
		id: 'pa-gradient-descent',
		topic: 'pyai',
		group: 'pa-math-for-ml',
		title: 'Gradient descent and learning rate',
		blurb: 'How does a model improve by rolling downhill on its loss?',
		nodes: [
			{ id: 'eq', kind: 'text', x: 10, y: 18, text: 'loss = w * w   (best weight: w = 0)', size: 'sm' },
			{ id: 'info', kind: 'text', x: 10, y: 38, text: 'start: w = -3, loss = 9', size: 'sm' },
			...Array.from({ length: 17 }, (_, i) => lossBar(i)),
			{ id: 'ax1', kind: 'text', x: 19, y: 268, text: '-4', anchor: 'middle', size: 'sm', visible: true },
			{ id: 'ax2', kind: 'text', x: 179, y: 268, text: '0', anchor: 'middle', size: 'sm', visible: true },
			{ id: 'ax3', kind: 'text', x: 339, y: 268, text: '4', anchor: 'middle', size: 'sm', visible: true },
			{ id: 'ball', kind: 'token', x: ballX(-3), y: ballY(-3), label: '' }
		].map((n) => (n.id === 'eq' || n.id === 'info' ? { ...n, visible: true } : n)) as SceneNode[],
		steps: [
			{ say: 'Loss measures how wrong the model is. Here one weight w and loss = w squared, so the best weight is 0. The ball starts at w = -3, where loss is 9.', show: ['ball'], focus: ['ball'] },
			{ say: 'The gradient is the slope of the loss. At w = -3 it is 2w = -6, so the loss falls toward the right. We step against the slope.', set: { info: { text: 'slope = 2w = -6' } }, focus: ['ball'] },
			{ say: 'Update rule: w = w - lr * slope. With learning rate lr = 0.25 that is -3 - 0.25 * (-6) = -1.5. The loss drops from 9 to 2.25.', move: { ball: { x: ballX(-1.5), y: ballY(-1.5) } }, set: { info: { text: 'lr = 0.25: w = -1.5, loss = 2.25' } } },
			{ say: 'The slope is now -3, so the step is 0.75 and w becomes -0.75. Steps shrink because the slope flattens near the bottom.', move: { ball: { x: ballX(-0.75), y: ballY(-0.75) } }, set: { info: { text: 'w = -0.75, loss = 0.56' } } },
			{ say: 'One more step lands at w = -0.375 with loss about 0.14. Repeating this thousands of times is what training a model is.', move: { ball: { x: ballX(-0.375), y: ballY(-0.375) } }, set: { info: { text: 'w = -0.375, loss = 0.14' }, ball: { tone: 'accent' } }, pulse: ['ball'] },
			{ say: 'Now a learning rate that is too big: lr = 1.1. From w = -3 the step is 1.1 * 6 = 6.6, which overshoots to w = 3.6, where the loss is 12.96, worse than the start.', move: { ball: { x: ballX(3.6), y: ballY(3.6) } }, set: { info: { text: 'lr = 1.1: w = 3.6, loss = 12.96' }, ball: { tone: 'neg' } } },
			{ say: 'The next step overshoots even more, to w = -4.32 with loss about 18.7. Each jump is bigger than the last, so training diverges.', move: { ball: { x: ballX(-4.32), y: ballY(-4.32) } }, set: { info: { text: 'next: w = -4.32, loss = 18.7' } } },
			{ say: 'Too small is also a problem. With lr = 0.001 each step moves w by only 0.006, so reaching the bottom takes a huge number of steps.', move: { ball: { x: ballX(-2.994), y: ballY(-2.994) } }, set: { info: { text: 'lr = 0.001: w = -2.994, barely moved' }, ball: { tone: 'warn' } } }
		]
	},

	// ───────── pa-sklearn ─────────
	{
		id: 'pa-overfit',
		topic: 'pyai',
		group: 'pa-sklearn',
		title: 'Underfitting and overfitting',
		blurb: 'Why does lower training error not always mean a better model?',
		nodes: [
			{ id: 'info', kind: 'text', x: 10, y: 18, text: 'error vs model complexity (illustrative)', size: 'sm', visible: true },
			{ id: 'lg1', kind: 'box', x: 212, y: 30, w: 10, h: 10, label: '', visible: true },
			{ id: 'lt1', kind: 'text', x: 226, y: 39, text: 'train', size: 'sm', visible: true },
			{ id: 'lg2', kind: 'box', x: 268, y: 30, w: 10, h: 10, label: '', tone: 'accent', visible: true },
			{ id: 'lt2', kind: 'text', x: 282, y: 39, text: 'validation', size: 'sm', visible: true },
			...[0, 1, 2, 3, 4].flatMap((i) => [trainBar(i), valBar(i), degLabel(i)]),
			{ id: 'axis', kind: 'text', x: 180, y: 288, text: 'model complexity (polynomial degree)', size: 'sm', anchor: 'middle', visible: true },
			{ id: 'gap', kind: 'text', x: 14, y: 54, text: 'gap = 45 - 2 = 43', size: 'sm', tone: 'neg' }
		],
		steps: [
			{ say: 'Degree 1 is a straight line: train error 40, validation error 42. Both are high, so the model is too simple for the pattern. This is underfitting.', show: ['tr0', 'va0', 'dg0'], set: { info: { text: 'degree 1: both errors high (underfit)' } } },
			{ say: 'Degree 2 can bend a little. Train error falls to 28 and validation error falls to 30, so added complexity is helping.', show: ['tr1', 'va1', 'dg1'], set: { info: { text: 'degree 2: both errors fall' } } },
			{ say: 'Degree 4 gives the lowest validation error, 22. This is the sweet spot: complex enough to learn the signal, not so complex that it learns noise.', show: ['tr2', 'va2', 'dg2'], set: { info: { text: 'degree 4: best validation error' } }, pulse: ['va2'] },
			{ say: 'Degree 8: train error keeps dropping to 9 but validation error climbs to 31. The model has started fitting quirks of the training rows.', show: ['tr3', 'va3', 'dg3'], set: { info: { text: 'degree 8: validation gets worse' } } },
			{ say: 'Degree 15 almost memorises the training set (error 2) while validation error reaches 45. This is overfitting: great on seen data, poor on new data.', show: ['tr4', 'va4', 'dg4'], set: { info: { text: 'degree 15: memorised the training set', }, va4: { tone: 'neg' } } },
			{ say: 'The gap between train and validation error is the warning sign: 2 points at degree 1 versus 43 at degree 15. Always look at both numbers.', show: ['gap'], focus: ['tr4', 'va4'] },
			{ say: 'Remedies for overfitting: more data, a simpler model, regularisation, or early stopping. For underfitting: a richer model or better features.', hide: ['gap'], set: { info: { text: 'fix: more data, simpler, regularise' } }, focus: ['va2'] }
		]
	},
	{
		id: 'pa-cross-validation',
		topic: 'pyai',
		group: 'pa-sklearn',
		title: '5-fold cross-validation',
		blurb: 'How can every row be used for training and for validation?',
		stage: { w: 360, h: 320 },
		nodes: [
			{ id: 'code', kind: 'text', x: 10, y: 20, text: 'cross_val_score(model, X, y, cv=5)', size: 'sm', visible: true },
			{ id: 'sch', kind: 'text', x: 308, y: 44, text: 'score', size: 'sm' },
			...[0, 1, 2, 3, 4].flatMap((r) => [
				{ id: `rl${r}`, kind: 'text', x: 6, y: 72 + 38 * r, text: `Round ${r + 1}`, size: 'sm' } as SceneNode,
				{ id: `sc${r}`, kind: 'text', x: 308, y: 72 + 38 * r, text: SCORES[r], size: 'md' } as SceneNode,
				...[0, 1, 2, 3, 4].map((c) => foldCell(r, c))
			]),
			{ id: 'mean', kind: 'box', x: 62, y: 248, w: 236, h: 36, label: 'mean 0.85, spread about 0.02', sub: 'average of the 5 scores', tone: 'accent' },
			{ id: 'tip', kind: 'text', x: 10, y: 304, text: 'Use StratifiedKFold for imbalanced classes, TimeSeriesSplit for time.', size: 'sm', w: 340 }
		],
		steps: [
			{ say: 'The data is cut into 5 equal folds. Round 1 holds out fold 1 for validation, trains on the other four, and records a score of 0.84.', show: ['sch', ...roundShow(0)], focus: ['f00'] },
			{ say: 'Round 2 holds out fold 2 and trains a fresh model on the rest. Score 0.88. A new model is trained every round, nothing carries over.', show: roundShow(1), focus: ['f11'] },
			{ say: 'Round 3 validates on fold 3 and scores 0.81. Scores differ because each round judges the model on different rows.', show: roundShow(2), focus: ['f22'] },
			{ say: 'Round 4 validates on fold 4: 0.86.', show: roundShow(3), focus: ['f33'] },
			{ say: 'Round 5 validates on fold 5: 0.86. Now every row has been used for validation exactly once and for training four times.', show: roundShow(4), focus: ['f44'] },
			{ say: 'The mean of the five scores is 0.85 and they vary by about 0.02. That is a steadier estimate than a single split, and the spread tells you how much to trust it.', show: ['mean'], pulse: ['mean'] },
			{ say: 'Pick settings with the cross-validation mean, keep the test set for one final check, and match the splitter to your data.', show: ['tip'], focus: ['tip'] }
		]
	},
	{
		id: 'pa-confusion-matrix',
		topic: 'pyai',
		group: 'pa-sklearn',
		title: 'Confusion matrix and metrics',
		blurb: 'How do accuracy, precision, recall and F1 come from four counts?',
		nodes: [
			{ id: 'hp', kind: 'text', x: 172, y: 58, text: 'predicted spam', size: 'sm', anchor: 'middle' },
			{ id: 'hn', kind: 'text', x: 292, y: 58, text: 'predicted ok', size: 'sm', anchor: 'middle' },
			{ id: 'rp', kind: 'text', x: 8, y: 104, text: 'actual spam', size: 'sm' },
			{ id: 'rn', kind: 'text', x: 8, y: 170, text: 'actual ok', size: 'sm' },
			{ id: 'tp', kind: 'box', x: 116, y: 70, w: 112, h: 56, label: 'TP 15', sub: 'spam caught', tone: 'accent' },
			{ id: 'fn', kind: 'box', x: 236, y: 70, w: 112, h: 56, label: 'FN 5', sub: 'spam missed', tone: 'neg' },
			{ id: 'fp', kind: 'box', x: 116, y: 136, w: 112, h: 56, label: 'FP 10', sub: 'good mail flagged', tone: 'warn' },
			{ id: 'tn', kind: 'box', x: 236, y: 136, w: 112, h: 56, label: 'TN 70', sub: 'good mail kept', tone: 'accent' },
			{ id: 'title', kind: 'text', x: 10, y: 24, text: 'A spam filter on 100 emails, 20 of them spam', size: 'sm' },
			{ id: 'm', kind: 'text', x: 10, y: 222, text: '', size: 'md', w: 340 }
		].map((n) => (n.id === 'title' ? { ...n, visible: true } : n)) as SceneNode[],
		steps: [
			{ say: 'A spam filter judged 100 emails, 20 of which really are spam. A true positive (TP) is spam that was flagged as spam: 15 of them.', show: ['hp', 'hn', 'rp', 'rn', 'tp'], focus: ['tp'] },
			{ say: 'A false negative (FN) is spam the filter missed and let into the inbox: 5. TP + FN = 20, all the real spam.', show: ['fn'], focus: ['fn'] },
			{ say: 'A false positive (FP) is good mail wrongly flagged as spam: 10. This is the mistake users notice most.', show: ['fp'], focus: ['fp'] },
			{ say: 'A true negative (TN) is good mail correctly left alone: 70. All four boxes add up to the 100 emails.', show: ['tn'], focus: ['tn'] },
			{ say: 'Accuracy counts all correct answers: 85 of 100. But 80 emails are not spam, so a filter that flags nothing would already score 0.80.', set: { m: { text: 'accuracy = (15 + 70) / 100 = 0.85' } }, show: ['m'], focus: ['tp', 'tn'] },
			{ say: 'Precision asks: of everything flagged as spam, how much really was? 15 of 25 flagged, so 0.60. Low precision means annoyed users.', set: { m: { text: 'precision = 15 / (15 + 10) = 0.60' } }, focus: ['tp', 'fp'] },
			{ say: 'Recall asks: of all real spam, how much did we catch? 15 of 20, so 0.75. Low recall means spam gets through.', set: { m: { text: 'recall = 15 / (15 + 5) = 0.75' } }, focus: ['tp', 'fn'] },
			{ say: 'F1 is the harmonic mean of precision and recall, a single number that is low if either one is low: about 0.67.', set: { m: { text: 'F1 = 2 * 0.60 * 0.75 / (0.60 + 0.75) = 0.67' } }, pulse: ['m'] }
		]
	},
	{
		id: 'pa-data-leakage',
		topic: 'pyai',
		group: 'pa-sklearn',
		title: 'Data leakage with a scaler',
		blurb: 'How does fitting a scaler before splitting inflate your test score?',
		nodes: [
			{ id: 'info', kind: 'text', x: 180, y: 18, text: 'x = 2, 4, 6, 8, 40   test row = 40', size: 'sm', anchor: 'middle' },
			{ id: 'hw', kind: 'text', x: 92, y: 40, text: 'Wrong', size: 'md', anchor: 'middle', tone: 'neg' },
			{ id: 'hr', kind: 'text', x: 267, y: 40, text: 'Right', size: 'md', anchor: 'middle', tone: 'accent' },
			{ id: 'w1', kind: 'box', x: 10, y: 50, w: 165, h: 40, label: 'fit scaler on ALL data', sub: 'mean 12 (test row inside)', tone: 'neg' },
			{ id: 'w2', kind: 'box', x: 10, y: 114, w: 165, h: 40, label: 'then split', sub: 'test = [40]' },
			{ id: 'w3', kind: 'box', x: 10, y: 178, w: 165, h: 40, label: 'score on test', sub: 'too optimistic', tone: 'neg' },
			{ id: 'ew1', kind: 'edge', from: 'w1', to: 'w2' },
			{ id: 'ew2', kind: 'edge', from: 'w2', to: 'w3' },
			{ id: 'r1', kind: 'box', x: 185, y: 50, w: 165, h: 40, label: 'split first', sub: 'test = [40] set aside' },
			{ id: 'r2', kind: 'box', x: 185, y: 114, w: 165, h: 40, label: 'fit scaler on train only', sub: 'mean 5, from 2, 4, 6, 8', tone: 'accent' },
			{ id: 'r3', kind: 'box', x: 185, y: 178, w: 165, h: 40, label: 'transform test with 5', sub: 'honest score', tone: 'accent' },
			{ id: 'er1', kind: 'edge', from: 'r1', to: 'r2' },
			{ id: 'er2', kind: 'edge', from: 'r2', to: 'r3' },
			{ id: 'bot', kind: 'text', x: 10, y: 250, text: 'make_pipeline(StandardScaler(), LogisticRegression()) refits the scaler inside each fold.', size: 'sm', w: 340 }
		].map((n) => (n.id === 'info' ? { ...n, visible: true } : n)) as SceneNode[],
		steps: [
			{ say: 'Say the data is x = 2, 4, 6, 8, 40 and we hold the row 40 out as the test row. Scaling subtracts the mean (and divides by the spread).', focus: ['info'] },
			{ say: 'Wrong way: fit the scaler on everything first. Its mean, 12, was computed using the test row.', show: ['hw', 'w1'], focus: ['w1'] },
			{ say: 'Then split. The training rows were scaled with a number that already contains information from the test row.', show: ['ew1', 'w2'], focus: ['w2'] },
			{ say: 'The test score looks better than it will in production, where future rows are unknown. Information leaked from test into training. This is data leakage.', show: ['ew2', 'w3'], pulse: ['w3'] },
			{ say: 'Right way: split first, and set the test row aside before any learning from the data happens.', show: ['hr', 'r1'], focus: ['r1'] },
			{ say: 'Fit the scaler on the training rows only: mean = (2 + 4 + 6 + 8) / 4 = 5.', show: ['er1', 'r2'], focus: ['r2'] },
			{ say: 'Apply that same fitted scaler to the test row. Test data is only ever transformed, never fitted on.', show: ['er2', 'r3'], pulse: ['r3'] },
			{ say: 'A Pipeline bundles the steps so cross-validation refits the scaler on each training fold. That prevents this mistake automatically.', show: ['bot'], focus: ['bot'] }
		]
	},

	// ───────── pa-data-viz-eda ─────────
	{
		id: 'pa-train-test-split',
		topic: 'pyai',
		group: 'pa-data-viz-eda',
		title: 'Splitting data into train and test',
		blurb: 'How do you hold data back so the final score is honest?',
		nodes: [
			{ id: 'code', kind: 'text', x: 10, y: 20, text: 'train_test_split(X, y, test_size=0.2, random_state=42)', size: 'sm', w: 340, visible: true },
			{ id: 'lab', kind: 'text', x: 20, y: 62, text: 'all data: 20 rows', size: 'sm' },
			...Array.from({ length: 20 }, (_, i) => tile(i)),
			{ id: 'bt', kind: 'box', x: 10, y: 150, w: 160, h: 40, label: 'Train: 16 rows', sub: 'the model learns here' },
			{ id: 'bs', kind: 'box', x: 190, y: 150, w: 160, h: 40, label: 'Test: 4 rows', sub: 'locked away', tone: 'accent' },
			{ id: 'bm', kind: 'box', x: 10, y: 216, w: 160, h: 40, label: 'model.fit(train)', sub: 'learn weights' },
			{ id: 'bv', kind: 'box', x: 190, y: 216, w: 160, h: 40, label: 'model.score(test)', sub: 'one final check', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'bt', to: 'bm' },
			{ id: 'e2', kind: 'edge', from: 'bs', to: 'bv' },
			{ id: 'warn', kind: 'text', x: 10, y: 282, text: 'Tuning against the test set uses it up. Use validation or cross-validation.', size: 'sm', w: 340, tone: 'warn' }
		],
		steps: [
			{ say: 'We have 20 rows. The goal is an honest estimate of how the model behaves on rows it has never seen, so some rows must be held back.', show: ['lab', ...Array.from({ length: 20 }, (_, i) => `r${i}`)] },
			{
				say: 'First shuffle, so the split is not biased by the file order, such as rows sorted by date or by class. random_state makes the shuffle repeatable.',
				set: Object.fromEntries(SHUFFLED.map((n, i) => [`r${i}`, { label: String(n) }]))
			},
			{
				say: 'Then hold out 20 percent: 4 rows go to the test set. They are scattered because the data was shuffled.',
				set: Object.fromEntries(TEST_POS.map((i) => [`r${i}`, { tone: 'accent' as const }]))
			},
			{ say: 'The other 16 rows form the training set. The test rows must stay invisible to everything that learns or chooses settings.', show: ['bt', 'bs'], focus: ['bt', 'bs'] },
			{ say: 'The model is fitted on the training rows only. Preprocessing such as scaling is also fitted here.', show: ['e1', 'bm'], focus: ['bm'] },
			{ say: 'The test rows are used once, at the end, to estimate real-world performance.', show: ['e2', 'bv'], pulse: ['bv'] },
			{ say: 'If you keep tuning against the test set it stops being honest. Tune with a validation split or cross-validation, and touch the test set once.', show: ['warn'], focus: ['warn'] }
		]
	}
];
