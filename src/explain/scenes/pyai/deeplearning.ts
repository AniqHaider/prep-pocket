import type { Scene } from '../../types';

/** Python for AI engineering: deep learning (PyTorch, transformers, Hugging Face, fine-tuning). */
export const paDeep: Scene[] = [
	// ───────── pa-pytorch-tensors ─────────
	{
		id: 'pa-autograd-graph',
		topic: 'pyai',
		group: 'pa-pytorch-tensors',
		title: 'Autograd: forward builds, backward flows',
		blurb: 'How does PyTorch know how to change each weight?',
		nodes: [
			{ id: 'w', kind: 'box', x: 20, y: 12, w: 96, h: 40, label: 'w = 3.0', sub: 'requires_grad' },
			{ id: 'x', kind: 'box', x: 132, y: 12, w: 96, h: 40, label: 'x = 2.0', sub: 'plain data' },
			{ id: 'b', kind: 'box', x: 244, y: 12, w: 96, h: 40, label: 'b = 1.0', sub: 'requires_grad' },
			{ id: 'm', kind: 'box', x: 76, y: 100, w: 110, h: 40, label: 'm = w * x', sub: '= 6.0' },
			{ id: 'a', kind: 'box', x: 76, y: 168, w: 110, h: 40, label: 'y = m + b', sub: '= 7.0' },
			{ id: 'l', kind: 'box', x: 56, y: 240, w: 150, h: 44, label: 'loss = (y - 5)^2', sub: '= 4.0' },
			{ id: 'e1', kind: 'edge', from: 'w', to: 'm' },
			{ id: 'e2', kind: 'edge', from: 'x', to: 'm' },
			{ id: 'e3', kind: 'edge', from: 'm', to: 'a' },
			{ id: 'e4', kind: 'edge', from: 'b', to: 'a' },
			{ id: 'e5', kind: 'edge', from: 'a', to: 'l' }
		],
		steps: [
			{ say: 'Two tensors are created with requires_grad=True: w and b. PyTorch will watch every operation that touches them. x is plain input data.', show: ['w', 'x', 'b'], focus: ['w', 'b'] },
			{ say: 'Forward pass, step one: w * x gives 6.0. As it computes, PyTorch records the multiplication as a node in a graph.', show: ['m', 'e1', 'e2'], pulse: ['m'] },
			{ say: 'Next, adding b gives y = 7.0. Another node joins the graph, remembering which tensors fed it.', show: ['a', 'e3', 'e4'], pulse: ['a'] },
			{ say: 'The loss compares y with a target of 5: (7 - 5)^2 = 4.0. The forward pass is done and the whole graph exists.', show: ['l', 'e5'], pulse: ['l'] },
			{ say: 'loss.backward() starts at the loss with gradient 1.0 and walks the graph backwards, applying the chain rule at every node.', set: { l: { sub: 'grad = 1.0', tone: 'warn' } }, focus: ['l'] },
			{ say: 'At y the gradient is 2 * (7 - 5) = 4.0. Addition passes it straight on, so m also gets 4.0.', set: { a: { sub: 'grad = 4.0', tone: 'warn' }, m: { sub: 'grad = 4.0', tone: 'warn' } }, pulse: ['a', 'm'] },
			{ say: 'At the leaves: w.grad = 4.0 * x = 8.0 and b.grad = 4.0 * 1 = 4.0. x gets nothing because it did not require grad.', set: { w: { sub: 'w.grad = 8.0', tone: 'accent' }, b: { sub: 'b.grad = 4.0', tone: 'accent' } }, pulse: ['w', 'b'] },
			{ say: 'The graph is freed after backward. Gradients stay in .grad and add up on every call, so an optimizer step is followed by zeroing them.', set: { m: { tone: 'neutral' }, a: { tone: 'neutral' }, l: { tone: 'neutral' } }, focus: ['w', 'b'] }
		]
	},

	// ───────── pa-pytorch-nn ─────────
	{
		id: 'pa-training-loop',
		topic: 'pyai',
		group: 'pa-pytorch-nn',
		title: 'The training loop, step by step',
		blurb: 'What happens on every iteration of PyTorch training?',
		nodes: [
			{ id: 'b1', kind: 'box', x: 110, y: 8, w: 150, h: 32, label: 'Next batch', sub: '', visible: false },
			{ id: 'b2', kind: 'box', x: 110, y: 54, w: 150, h: 32, label: 'optimizer.zero_grad()' },
			{ id: 'b3', kind: 'box', x: 110, y: 100, w: 150, h: 32, label: 'pred = model(x)' },
			{ id: 'b4', kind: 'box', x: 110, y: 146, w: 150, h: 36, label: 'loss = loss_fn(pred, y)' },
			{ id: 'b5', kind: 'box', x: 110, y: 192, w: 150, h: 32, label: 'loss.backward()' },
			{ id: 'b6', kind: 'box', x: 110, y: 238, w: 150, h: 32, label: 'optimizer.step()' },
			{ id: 'tok', kind: 'token', x: 56, y: 24, label: '', r: 8 },
			{ id: 'lt', kind: 'text', x: 270, y: 160, text: 'loss 2.30', size: 'sm' },
			{ id: 'e1', kind: 'edge', from: 'b1', to: 'b2' },
			{ id: 'e2', kind: 'edge', from: 'b2', to: 'b3' },
			{ id: 'e3', kind: 'edge', from: 'b3', to: 'b4' },
			{ id: 'e4', kind: 'edge', from: 'b4', to: 'b5' },
			{ id: 'e5', kind: 'edge', from: 'b5', to: 'b6' }
		],
		steps: [
			{ say: 'Each iteration starts with one batch: a small group of examples, say 32, taken from the DataLoader.', show: ['b1', 'tok'], focus: ['b1'] },
			{ say: 'Clear the gradients left over from the previous step. Without this they would pile up, because backward() adds to .grad.', show: ['b2', 'e1'], move: { tok: { x: 56, y: 70 } }, pulse: ['b2'] },
			{ say: 'Forward pass: the model turns the batch into predictions. PyTorch records the graph as it goes.', show: ['b3', 'e2'], move: { tok: { x: 56, y: 116 } }, pulse: ['b3'] },
			{ say: 'The loss function scores the predictions against the true labels and returns one number. Here it is 2.30: higher means worse.', show: ['b4', 'e3', 'lt'], move: { tok: { x: 56, y: 162 } }, pulse: ['b4'] },
			{ say: 'backward() walks the graph and fills in .grad for every parameter: how much the loss changes if that weight changes.', show: ['b5', 'e4'], move: { tok: { x: 56, y: 208 } }, pulse: ['b5'] },
			{ say: 'The optimizer nudges each weight against its gradient, for example weight = weight - lr * grad for plain SGD.', show: ['b6', 'e5'], move: { tok: { x: 56, y: 254 } }, pulse: ['b6'], set: { b6: { tone: 'accent' } } },
			{ say: 'Loop back to the next batch. The weights are a little better, so the loss is lower, here 1.85. Repeat for thousands of steps.', move: { tok: { x: 56, y: 24 } }, set: { lt: { text: 'loss 1.85' }, b6: { tone: 'neutral' } }, pulse: ['b1'] }
		]
	},
	{
		id: 'pa-dataloader',
		topic: 'pyai',
		group: 'pa-pytorch-nn',
		title: 'Dataset to shuffled batches',
		blurb: 'How does a DataLoader feed the model?',
		nodes: [
			{ id: 'tbl', kind: 'table', x: 10, y: 24, title: 'Dataset: 6 items', cols: ['i', 'x', 'y'], rows: [['0', '0.2', '0'], ['1', '0.9', '1'], ['2', '0.4', '0'], ['3', '0.7', '1'], ['4', '0.1', '0'], ['5', '0.8', '1']], colW: 46, hl: [] },
			{ id: 'ld', kind: 'box', x: 190, y: 28, w: 150, h: 50, label: 'DataLoader', sub: 'batch_size=2, shuffle=True' },
			{ id: 'ord', kind: 'text', x: 190, y: 96, text: 'order: 3, 0, 5, 1, 4, 2', size: 'sm', w: 150 },
			{ id: 'k1', kind: 'box', x: 190, y: 120, w: 150, h: 36, label: 'batch 1', sub: 'items 3, 0' },
			{ id: 'k2', kind: 'box', x: 190, y: 168, w: 150, h: 36, label: 'batch 2', sub: 'items 5, 1' },
			{ id: 'k3', kind: 'box', x: 190, y: 216, w: 150, h: 36, label: 'batch 3', sub: 'items 4, 2' },
			{ id: 'e1', kind: 'edge', from: 'tbl', to: 'ld' }
		],
		steps: [
			{ say: 'A Dataset only has to answer two questions: how many items (len) and what is item i (getitem). Here it has 6 rows of features x and label y.', show: ['tbl'], focus: ['tbl'] },
			{ say: 'A DataLoader wraps the Dataset. batch_size=2 means it groups items in twos, and shuffle=True randomises the order each epoch.', show: ['ld', 'e1'], pulse: ['ld'] },
			{ say: 'An epoch is one full pass over the data. At its start the loader draws a random order of the indexes: 3, 0, 5, 1, 4, 2.', show: ['ord'], focus: ['ord'] },
			{ say: 'Batch 1 takes the first two indexes from that order: rows 3 and 0. The loader stacks them into tensors for the model.', show: ['k1'], set: { tbl: { hl: [3, 0] } }, pulse: ['k1'] },
			{ say: 'Batch 2 is rows 5 and 1. Each row is used exactly once per epoch.', show: ['k2'], set: { tbl: { hl: [5, 1] } }, pulse: ['k2'] },
			{ say: 'Batch 3 is rows 4 and 2. That is the whole epoch: 6 items in 3 batches of 2.', show: ['k3'], set: { tbl: { hl: [4, 2] } }, pulse: ['k3'] },
			{ say: 'Next epoch the order is reshuffled, so batches differ every time. Shuffling stops the model learning from the order of the data.', set: { tbl: { hl: [] }, ord: { text: 'order: 1, 4, 0, 2, 5, 3' }, k1: { sub: 'items 1, 4' }, k2: { sub: 'items 0, 2' }, k3: { sub: 'items 5, 3' } }, pulse: ['ord'] }
		]
	},
	{
		id: 'pa-train-eval-mode',
		topic: 'pyai',
		group: 'pa-pytorch-nn',
		title: 'train() versus eval()',
		blurb: 'What does model.eval() actually change?',
		nodes: [
			{ id: 'mode', kind: 'box', x: 80, y: 14, w: 200, h: 34, label: 'model.train()', tone: 'warn' },
			{ id: 'h1', kind: 'box', x: 8, y: 100, w: 76, h: 40, label: 'h1', sub: '1.0' },
			{ id: 'h2', kind: 'box', x: 94, y: 100, w: 76, h: 40, label: 'h2', sub: '2.0' },
			{ id: 'h3', kind: 'box', x: 180, y: 100, w: 76, h: 40, label: 'h3', sub: '3.0' },
			{ id: 'h4', kind: 'box', x: 266, y: 100, w: 76, h: 40, label: 'h4', sub: '4.0' },
			{ id: 'note', kind: 'text', x: 180, y: 190, text: 'Dropout with p = 0.5 on four activations', size: 'sm', anchor: 'middle', w: 330 },
			{ id: 'note2', kind: 'text', x: 180, y: 240, text: 'eval() does not stop gradients. For that, wrap inference in torch.no_grad().', size: 'sm', anchor: 'middle', w: 320 }
		],
		steps: [
			{ say: 'A layer produces four activations: 1.0, 2.0, 3.0 and 4.0. Some layers, like Dropout, treat them differently while training and while predicting.', show: ['h1', 'h2', 'h3', 'h4', 'note'] },
			{ say: 'In train mode, Dropout randomly zeroes activations with probability p = 0.5. This forces the network not to rely on any single unit.', show: ['mode'], focus: ['mode'] },
			{ say: 'This time h2 and h4 are dropped to 0.0. A fresh random choice is made on every forward pass.', set: { h2: { sub: '0.0', tone: 'neg' }, h4: { sub: '0.0', tone: 'neg' } }, pulse: ['h2', 'h4'] },
			{ say: 'The survivors are scaled by 1 / (1 - p) = 2, so the expected total stays the same: h1 becomes 2.0 and h3 becomes 6.0.', set: { h1: { sub: '2.0', tone: 'accent' }, h3: { sub: '6.0', tone: 'accent' } }, pulse: ['h1', 'h3'] },
			{ say: 'model.eval() switches Dropout off: every activation passes through unchanged. Predictions are now deterministic.', set: { mode: { label: 'model.eval()', tone: 'accent' }, h1: { sub: '1.0', tone: 'neutral' }, h2: { sub: '2.0', tone: 'neutral' }, h3: { sub: '3.0', tone: 'neutral' }, h4: { sub: '4.0', tone: 'neutral' } }, focus: ['mode'] },
			{ say: 'BatchNorm also changes: it uses running averages instead of the current batch statistics. That is why eval() matters beyond dropout.', set: { note: { text: 'BatchNorm: batch statistics become running averages' } }, pulse: ['note'] },
			{ say: 'eval() changes layer behaviour only. It does not turn off gradient tracking, so pair it with torch.no_grad() to save memory when predicting.', show: ['note2'], focus: ['note2'] },
			{ say: 'Forget eval() at inference and Dropout keeps zeroing units, so the same input gives different, noisier answers on each call.', set: { mode: { label: 'forgot eval()', tone: 'neg' }, h2: { sub: '0.0', tone: 'neg' }, h4: { sub: '0.0', tone: 'neg' } }, pulse: ['mode'] }
		]
	},

	// ───────── pa-pytorch-training ─────────
	{
		id: 'pa-grad-accumulation',
		topic: 'pyai',
		group: 'pa-pytorch-training',
		title: 'Gradient accumulation',
		blurb: 'How do you train with a big batch that does not fit in memory?',
		nodes: [
			{ id: 'm1', kind: 'box', x: 8, y: 16, w: 76, h: 40, label: 'micro 1', sub: '8 samples' },
			{ id: 'm2', kind: 'box', x: 94, y: 16, w: 76, h: 40, label: 'micro 2', sub: '8 samples' },
			{ id: 'm3', kind: 'box', x: 180, y: 16, w: 76, h: 40, label: 'micro 3', sub: '8 samples' },
			{ id: 'm4', kind: 'box', x: 266, y: 16, w: 76, h: 40, label: 'micro 4', sub: '8 samples' },
			{ id: 'g', kind: 'box', x: 70, y: 120, w: 220, h: 44, label: '.grad buffer', sub: 'empty' },
			{ id: 'st', kind: 'box', x: 70, y: 214, w: 220, h: 40, label: 'optimizer.step()', sub: 'then zero_grad()' },
			{ id: 'cap', kind: 'text', x: 180, y: 284, text: 'effective batch = 4 x 8 = 32', size: 'sm', anchor: 'middle', w: 300 },
			{ id: 'a1', kind: 'edge', from: 'm1', to: 'g' },
			{ id: 'a2', kind: 'edge', from: 'm2', to: 'g' },
			{ id: 'a3', kind: 'edge', from: 'm3', to: 'g' },
			{ id: 'a4', kind: 'edge', from: 'm4', to: 'g' },
			{ id: 'a5', kind: 'edge', from: 'g', to: 'st' }
		],
		steps: [
			{ say: 'You want a batch of 32 for stable training, but only 8 samples fit in GPU memory. Split the batch into 4 micro-batches of 8.', show: ['m1', 'm2', 'm3', 'm4'] },
			{ say: 'Micro-batch 1: forward, then (loss / 4).backward(). Dividing by 4 makes the summed gradients equal the average over 32. No optimizer step yet.', show: ['g', 'a1'], set: { g: { sub: 'after 1 of 4', tone: 'warn' } }, focus: ['m1'] },
			{ say: 'Micro-batch 2: backward() adds its gradients on top of what is already in .grad. This adding is the default behaviour.', show: ['a2'], set: { g: { sub: 'after 2 of 4' } }, focus: ['m2'] },
			{ say: 'Micro-batch 3 adds in the same way. Memory use stays at the size of one micro-batch, because each graph is freed after its backward.', show: ['a3'], set: { g: { sub: 'after 3 of 4' } }, focus: ['m3'] },
			{ say: 'Micro-batch 4 completes the set. The buffer now holds the gradient of the full batch of 32.', show: ['a4'], set: { g: { sub: 'after 4 of 4', tone: 'accent' } }, focus: ['m4'] },
			{ say: 'Only now call optimizer.step() once, then zero_grad(). One weight update for four forward and backward passes.', show: ['st', 'a5'], set: { st: { tone: 'accent' } }, pulse: ['st'] },
			{ say: 'The buffer is cleared and the cycle starts again. The trade: the same result as a batch of 32, but slower, since the pieces run one after another.', show: ['cap'], set: { g: { sub: 'empty', tone: 'neutral' }, st: { tone: 'neutral' } }, pulse: ['cap'] }
		]
	},
	{
		id: 'pa-mixed-precision',
		topic: 'pyai',
		group: 'pa-pytorch-training',
		title: 'Mixed precision with autocast',
		blurb: 'How can 16-bit numbers speed up training safely?',
		nodes: [
			{ id: 'w', kind: 'box', x: 60, y: 8, w: 240, h: 40, label: 'Weights (fp32)', sub: '4 bytes per number' },
			{ id: 'c', kind: 'box', x: 60, y: 66, w: 240, h: 40, label: 'torch.autocast region', sub: 'matmuls run in bf16: 2 bytes' },
			{ id: 'f', kind: 'box', x: 60, y: 124, w: 240, h: 40, label: 'Sensitive ops stay fp32', sub: 'softmax, loss, reductions' },
			{ id: 'g', kind: 'box', x: 60, y: 182, w: 240, h: 40, label: 'Backward pass', sub: 'fp16 also needs a GradScaler' },
			{ id: 'u', kind: 'box', x: 60, y: 240, w: 240, h: 40, label: 'optimizer.step()', sub: 'updates the fp32 weights' },
			{ id: 'e1', kind: 'edge', from: 'w', to: 'c' },
			{ id: 'e2', kind: 'edge', from: 'c', to: 'f' },
			{ id: 'e3', kind: 'edge', from: 'f', to: 'g' },
			{ id: 'e4', kind: 'edge', from: 'g', to: 'u' }
		],
		steps: [
			{ say: 'The master copy of the weights is kept in fp32: 32-bit floats, 4 bytes per number. This precision keeps tiny updates from vanishing.', show: ['w'], focus: ['w'] },
			{ say: 'Inside torch.autocast, matrix multiplies and convolutions run in 16-bit (bf16 here). That halves memory traffic and is faster on modern GPUs.', show: ['c', 'e1'], pulse: ['c'] },
			{ say: 'Operations that lose accuracy in 16-bit, such as softmax, losses and large sums, are kept in fp32 by autocast automatically.', show: ['f', 'e2'], set: { f: { tone: 'warn' } }, pulse: ['f'] },
			{ say: 'The backward pass follows the same precision choices, producing gradients for each parameter.', show: ['g', 'e3'], pulse: ['g'] },
			{ say: 'fp16 has a narrow range, so tiny gradients underflow to zero. A GradScaler scales the loss up first. bf16 has fp32 range and usually needs no scaler.', set: { g: { tone: 'warn' } }, focus: ['g'] },
			{ say: 'The optimizer updates the fp32 weights, so small updates are not rounded away. Next iteration, autocast casts them down again.', show: ['u', 'e4'], set: { u: { tone: 'accent' } }, pulse: ['u'] }
		]
	},

	// ───────── pa-transformers ─────────
	{
		id: 'pa-attention',
		topic: 'pyai',
		group: 'pa-transformers',
		title: 'Self-attention: query, keys, values',
		blurb: 'How does one token decide which others matter?',
		stage: { w: 360, h: 320 },
		nodes: [
			{ id: 'k1', kind: 'box', x: 8, y: 110, w: 100, h: 40, label: 'the', sub: 'value = 1' },
			{ id: 'k2', kind: 'box', x: 130, y: 110, w: 100, h: 40, label: 'cat', sub: 'value = 4' },
			{ id: 'k3', kind: 'box', x: 252, y: 110, w: 100, h: 40, label: 'sat', sub: 'value = 2' },
			{ id: 'q', kind: 'box', x: 110, y: 14, w: 140, h: 40, label: 'Query from: sat', sub: 'what do I need?' },
			{ id: 'q1', kind: 'edge', from: 'q', to: 'k1' },
			{ id: 'q2', kind: 'edge', from: 'q', to: 'k2' },
			{ id: 'q3', kind: 'edge', from: 'q', to: 'k3' },
			{ id: 'w1', kind: 'text', x: 58, y: 180, text: 'weight 0.1', size: 'sm', anchor: 'middle' },
			{ id: 'w2', kind: 'text', x: 180, y: 180, text: 'weight 0.7', size: 'sm', anchor: 'middle' },
			{ id: 'w3', kind: 'text', x: 302, y: 180, text: 'weight 0.2', size: 'sm', anchor: 'middle' },
			{ id: 'out', kind: 'box', x: 60, y: 206, w: 240, h: 44, label: 'Output for sat = 3.3', sub: '0.1 x 1 + 0.7 x 4 + 0.2 x 2' },
			{ id: 'note', kind: 'text', x: 180, y: 280, text: 'Every token does this at once, using its own query.', size: 'sm', anchor: 'middle', w: 330 }
		],
		steps: [
			{ say: 'Three tokens: the, cat, sat. Each carries a key (what it offers for matching) and a value (the information it passes on). Values are simple numbers here.', show: ['k1', 'k2', 'k3'] },
			{ say: 'The token sat builds a query: a vector describing what it is looking for in the sentence.', show: ['q'], focus: ['q'] },
			{ say: 'The query is compared with every key using a dot product. A bigger result means a better match, and sat is compared with itself too.', show: ['q1', 'q2', 'q3'], pulse: ['k1', 'k2', 'k3'] },
			{ say: 'Softmax turns the raw scores into weights that are positive and sum to 1: 0.1, 0.7 and 0.2.', show: ['w1', 'w2', 'w3'], pulse: ['w1', 'w2', 'w3'] },
			{ say: 'The key for cat matched best, so cat gets 70 percent of the attention.', set: { k2: { tone: 'accent' } }, focus: ['k2', 'w2'] },
			{ say: 'The output is the weighted sum of values: 0.1 x 1 + 0.7 x 4 + 0.2 x 2 = 3.3. It mostly carries cat information into sat.', show: ['out'], set: { out: { tone: 'accent' } }, pulse: ['out'] },
			{ say: 'In a real model, queries, keys and values are learned vectors, scores are divided by the square root of their size, and many heads run in parallel.', show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'pa-transformer-block',
		topic: 'pyai',
		group: 'pa-transformers',
		title: 'Inside one transformer block',
		blurb: 'What is repeated dozens of times in an LLM?',
		nodes: [
			{ id: 'in', kind: 'box', x: 70, y: 6, w: 180, h: 28, label: 'Token vectors in' },
			{ id: 'n1', kind: 'box', x: 70, y: 42, w: 180, h: 28, label: 'Normalise' },
			{ id: 'a', kind: 'box', x: 70, y: 78, w: 180, h: 28, label: 'Multi-head attention' },
			{ id: 'r1', kind: 'box', x: 70, y: 114, w: 180, h: 28, label: 'Add input back (residual)' },
			{ id: 'n2', kind: 'box', x: 70, y: 150, w: 180, h: 28, label: 'Normalise' },
			{ id: 'm', kind: 'box', x: 70, y: 186, w: 180, h: 28, label: 'MLP per token' },
			{ id: 'r2', kind: 'box', x: 70, y: 222, w: 180, h: 28, label: 'Add input back (residual)' },
			{ id: 'o', kind: 'box', x: 70, y: 258, w: 180, h: 28, label: 'Vectors out, same shape' },
			{ id: 'rep', kind: 'text', x: 262, y: 150, text: 'x N blocks', size: 'sm', w: 90 },
			{ id: 'e1', kind: 'edge', from: 'in', to: 'n1' },
			{ id: 'e2', kind: 'edge', from: 'n1', to: 'a' },
			{ id: 'e3', kind: 'edge', from: 'a', to: 'r1' },
			{ id: 'e4', kind: 'edge', from: 'r1', to: 'n2' },
			{ id: 'e5', kind: 'edge', from: 'n2', to: 'm' },
			{ id: 'e6', kind: 'edge', from: 'm', to: 'r2' },
			{ id: 'e7', kind: 'edge', from: 'r2', to: 'o' }
		],
		steps: [
			{ say: 'Each token enters the block as a vector of numbers (its embedding, or the output of the previous block). The block keeps this shape end to end.', show: ['in'] },
			{ say: 'First, normalise the vectors (LayerNorm or RMSNorm) so their values stay in a stable range. This keeps deep stacks trainable.', show: ['n1', 'e1'], pulse: ['n1'] },
			{ say: 'Self-attention lets every token look at the others and mix in their information. This is the only step where tokens talk to each other.', show: ['a', 'e2'], set: { a: { tone: 'accent' } }, pulse: ['a'] },
			{ say: 'The attention result is added to the original input. This residual shortcut lets information and gradients skip past the block.', show: ['r1', 'e3'], pulse: ['r1'] },
			{ say: 'Normalise again, then a small MLP (two linear layers with a non-linearity) transforms each token on its own. This is where much of the knowledge is stored.', show: ['n2', 'e4', 'm', 'e5'], set: { m: { tone: 'accent' } }, pulse: ['m'] },
			{ say: 'A second residual adds the MLP input back to its output.', show: ['r2', 'e6'], pulse: ['r2'] },
			{ say: 'The vectors leave with the same shape they came in with. That is why identical blocks can be stacked: an LLM repeats this N times.', show: ['o', 'e7', 'rep'], focus: ['o', 'rep'] }
		]
	},
	{
		id: 'pa-next-token',
		topic: 'pyai',
		group: 'pa-transformers',
		title: 'Generating text one token at a time',
		blurb: 'How does a decoder-only model write a sentence?',
		nodes: [
			{ id: 't1', kind: 'box', x: 8, y: 14, w: 50, h: 30, label: 'The', visible: true },
			{ id: 't2', kind: 'box', x: 64, y: 14, w: 50, h: 30, label: 'cat', visible: true },
			{ id: 't3', kind: 'box', x: 120, y: 14, w: 50, h: 30, label: 'sat', visible: true },
			{ id: 't4', kind: 'box', x: 176, y: 14, w: 50, h: 30, label: 'on' },
			{ id: 't5', kind: 'box', x: 232, y: 14, w: 50, h: 30, label: 'the' },
			{ id: 't6', kind: 'box', x: 288, y: 14, w: 56, h: 30, label: '<eos>' },
			{ id: 'mod', kind: 'box', x: 80, y: 86, w: 200, h: 40, label: 'Decoder-only model', sub: 'reads all tokens so far' },
			{ id: 'pr', kind: 'doc', x: 90, y: 154, w: 180, title: 'next-token probabilities', lines: ['on   0.62', 'the  0.14', 'down 0.09'], hl: [] },
			{ id: 'cap', kind: 'text', x: 180, y: 262, text: 'The prompt is The cat sat', size: 'sm', anchor: 'middle', w: 330 },
			{ id: 'e1', kind: 'edge', from: 't2', to: 'mod' },
			{ id: 'e2', kind: 'edge', from: 'mod', to: 'pr' }
		],
		steps: [
			{ say: 'The prompt is three tokens: The, cat, sat. A token is a chunk of text, often a word or part of one, turned into a number for the model.', show: ['cap'], focus: ['t1', 't2', 't3'] },
			{ say: 'The model reads all tokens so far and outputs a score for every token in its vocabulary. It predicts only the next token.', show: ['mod', 'e1'], pulse: ['mod'] },
			{ say: 'Softmax turns the scores into probabilities. Here on is 0.62, the is 0.14, down is 0.09, and the rest share the remaining 0.15.', show: ['e2', 'pr'], pulse: ['pr'] },
			{ say: 'Pick one token: greedy decoding takes the highest, sampling draws randomly by probability. Here on wins, and it joins the text.', show: ['t4'], set: { pr: { hl: [0] }, t4: { tone: 'accent' }, cap: { text: 'Picked: on' } }, pulse: ['t4'] },
			{ say: 'The loop: feed the longer text back in. Now the prompt is four tokens, and the model proposes the next one: the, with 0.55.', show: ['t5'], set: { pr: { lines: ['the  0.55', 'a    0.20', 'my   0.08'], hl: [0] }, t4: { tone: 'neutral' }, t5: { tone: 'accent' }, cap: { text: 'Prompt is now The cat sat on' } }, pulse: ['t5'] },
			{ say: 'This repeats one token per step. Generation ends when the model emits a special end-of-sequence token or a length limit is reached.', show: ['t6'], set: { t5: { tone: 'neutral' }, t6: { tone: 'warn' }, cap: { text: 'Stop on <eos> or max length' } }, pulse: ['t6'] }
		]
	},
	{
		id: 'pa-kv-cache',
		topic: 'pyai',
		group: 'pa-transformers',
		title: 'The KV cache',
		blurb: 'Why does generation reuse earlier work?',
		nodes: [
			{ id: 'tbl', kind: 'table', x: 20, y: 18, title: 'Cache: key and value per token', cols: ['token', 'key', 'value'], rows: [['The', 'k1', 'v1'], ['cat', 'k2', 'v2'], ['sat', 'k3', 'v3']], colW: 70, hl: [] },
			{ id: 'nt', kind: 'box', x: 20, y: 210, w: 210, h: 40, label: 'New token: on', sub: 'needs its own k, v' },
			{ id: 'e1', kind: 'edge', from: 'nt', to: 'tbl', label: 'append' },
			{ id: 'note', kind: 'text', x: 180, y: 284, text: 'Cost: the cache grows with every token.', size: 'sm', anchor: 'middle', w: 330 }
		],
		steps: [
			{ say: 'After reading the prompt The cat sat, each layer has stored a key and a value for every token. This store is the KV cache.', show: ['tbl'], focus: ['tbl'] },
			{ say: 'The model generates a new token, on. Its key and value are new, but the keys and values of the earlier tokens have not changed.', show: ['nt'], pulse: ['nt'] },
			{ say: 'Without a cache the model would recompute k and v for all earlier tokens at every step. With it, only the new row is computed.', show: ['e1'], set: { tbl: { rows: [['The', 'k1', 'v1'], ['cat', 'k2', 'v2'], ['sat', 'k3', 'v3'], ['on', 'k4', 'v4']], hl: [3] } }, pulse: ['tbl'] },
			{ say: 'To predict the next token, its query attends over all four cached rows. Old rows are read, never recomputed.', set: { tbl: { hl: [0, 1, 2, 3] } }, focus: ['tbl'] },
			{ say: 'The next token, the, arrives and appends just one more row. Each step projects a single token and then attends over the cache.', set: { nt: { label: 'New token: the' }, tbl: { rows: [['The', 'k1', 'v1'], ['cat', 'k2', 'v2'], ['sat', 'k3', 'v3'], ['on', 'k4', 'v4'], ['the', 'k5', 'v5']], hl: [4] } }, pulse: ['nt'] },
			{ say: 'The trade-off is memory: the cache grows by one row per token in every layer, so long contexts and many users need a lot of GPU memory.', show: ['note'], set: { tbl: { tone: 'warn', hl: [] } }, pulse: ['note'] }
		]
	},

	// ───────── pa-huggingface ─────────
	{
		id: 'pa-hf-pipeline',
		topic: 'pyai',
		group: 'pa-huggingface',
		title: 'Text to tokens to model to text',
		blurb: 'What does a Hugging Face pipeline do inside?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'txt', kind: 'box', x: 70, y: 6, w: 220, h: 28, label: 'Text: Hello world' },
			{ id: 'tok', kind: 'box', x: 70, y: 48, w: 220, h: 38, label: 'AutoTokenizer', sub: 'text to integer ids' },
			{ id: 'ids', kind: 'box', x: 70, y: 100, w: 220, h: 28, label: 'ids: 15496, 995' },
			{ id: 'mod', kind: 'box', x: 70, y: 142, w: 220, h: 38, label: 'AutoModelForCausalLM', sub: 'model.generate(...)' },
			{ id: 'oid', kind: 'box', x: 70, y: 194, w: 220, h: 28, label: 'ids: 15496, 995, 11, 703' },
			{ id: 'dec', kind: 'box', x: 70, y: 236, w: 220, h: 38, label: 'tokenizer.decode', sub: 'ids back to text' },
			{ id: 'res', kind: 'text', x: 180, y: 294, text: 'Hello world, how', size: 'md', anchor: 'middle', w: 300 },
			{ id: 'pip', kind: 'text', x: 180, y: 318, text: 'pipeline(...) wraps all of this in one call.', size: 'sm', anchor: 'middle', w: 330 },
			{ id: 'e1', kind: 'edge', from: 'txt', to: 'tok' },
			{ id: 'e2', kind: 'edge', from: 'tok', to: 'ids' },
			{ id: 'e3', kind: 'edge', from: 'ids', to: 'mod' },
			{ id: 'e4', kind: 'edge', from: 'mod', to: 'oid' },
			{ id: 'e5', kind: 'edge', from: 'oid', to: 'dec' }
		],
		steps: [
			{ say: 'You start with plain text. Models cannot read letters, only numbers, so the text must be converted first.', show: ['txt'] },
			{ say: 'The tokenizer splits the text into tokens and maps each to an integer id from its vocabulary. It must be the one that matches the model.', show: ['tok', 'e1'], pulse: ['tok'] },
			{ say: 'The result is a list of ids. These are illustrative numbers. With return_tensors="pt" they come back as PyTorch tensors, ready for the model.', show: ['ids', 'e2'], pulse: ['ids'] },
			{ say: 'The model loads with AutoModelForCausalLM, and generate() runs the next-token loop: predict, append, repeat.', show: ['mod', 'e3'], set: { mod: { tone: 'accent' } }, pulse: ['mod'] },
			{ say: 'The output is a list of ids that contains the prompt ids followed by the newly generated ones, here 11 and 703.', show: ['oid', 'e4'], pulse: ['oid'] },
			{ say: 'tokenizer.decode maps the ids back to text, using the same vocabulary in reverse.', show: ['dec', 'e5', 'res'], pulse: ['res'] },
			{ say: 'The pipeline helper performs exactly these three stages for you: tokenize, run the model, decode.', show: ['pip'], focus: ['pip'] }
		]
	},

	// ───────── pa-finetuning ─────────
	{
		id: 'pa-lora',
		topic: 'pyai',
		group: 'pa-finetuning',
		title: 'LoRA: tiny adapters on a frozen model',
		blurb: 'How can you fine-tune a big model by training a few weights?',
		nodes: [
			{ id: 'inp', kind: 'box', x: 110, y: 8, w: 140, h: 30, label: 'input x' },
			{ id: 'W', kind: 'box', x: 14, y: 70, w: 150, h: 96, label: 'W (pretrained)', sub: '1,000,000 weights' },
			{ id: 'A', kind: 'box', x: 200, y: 70, w: 140, h: 40, label: 'A (trainable)', sub: '1000 x 8' },
			{ id: 'B', kind: 'box', x: 200, y: 126, w: 140, h: 40, label: 'B (trainable)', sub: '8 x 1000' },
			{ id: 'out', kind: 'box', x: 90, y: 200, w: 180, h: 40, label: 'output y', sub: 'Wx + B(Ax)' },
			{ id: 'cnt', kind: 'text', x: 180, y: 270, text: 'trainable: 16,000 of 1,016,000', size: 'sm', anchor: 'middle', w: 330 },
			{ id: 'e1', kind: 'edge', from: 'inp', to: 'W' },
			{ id: 'e2', kind: 'edge', from: 'inp', to: 'A' },
			{ id: 'e3', kind: 'edge', from: 'A', to: 'B' },
			{ id: 'e4', kind: 'edge', from: 'W', to: 'out' },
			{ id: 'e5', kind: 'edge', from: 'B', to: 'out' }
		],
		steps: [
			{ say: 'One layer of a pretrained model has a weight matrix W of 1000 x 1000, which is 1,000,000 numbers. Full fine-tuning would update all of them.', show: ['W'], focus: ['W'] },
			{ say: 'LoRA freezes W. No gradients or optimizer state are kept for it, which saves most of the memory.', set: { W: { label: 'W (frozen)' } }, pulse: ['W'] },
			{ say: 'It adds two thin matrices beside it: A is 1000 x 8 and B is 8 x 1000. The narrow middle, 8, is the rank r.', show: ['A', 'B', 'e3'], set: { A: { tone: 'accent' }, B: { tone: 'accent' } }, pulse: ['A', 'B'] },
			{ say: 'The input flows through both paths: the frozen W, and the small A then B path.', show: ['inp', 'e1', 'e2'], pulse: ['inp'] },
			{ say: 'The two results are added: y = Wx + B(Ax). B starts at zero, so training begins exactly at the pretrained behaviour.', show: ['out', 'e4', 'e5'], pulse: ['out'] },
			{ say: 'Only A and B learn: 8,000 + 8,000 = 16,000 numbers against 1,000,000 frozen ones, about 1.6 percent. QLoRA also stores W in 4-bit.', show: ['cnt'], focus: ['A', 'B', 'cnt'] },
			{ say: 'After training, save just A and B as a small adapter file, or merge them into W (W + BA). A merged model runs at the original speed.', hide: ['A', 'B', 'e2', 'e3', 'e5', 'inp', 'e1'], set: { W: { label: 'W + BA (merged)', tone: 'accent' }, out: { sub: 'same cost as W' } }, pulse: ['W'] }
		]
	}
];
