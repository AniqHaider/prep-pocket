import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');
// Python snippets use double quotes only, so the JS strings around them can stay single-quoted.

export const topics: DbTopic[] = [
	{
		id: 'pa-pytorch-tensors',
		title: 'PyTorch tensors and autograd',
		level: 'basic',
		summary: 'Understand tensors, devices and how autograd turns a forward pass into gradients.',
		scenes: ['pa-autograd-graph'],
		notes: md(
			'A **tensor** is PyTorch\'s n-dimensional array, like a NumPy array with two extras: it can live on a **GPU**, and it can track the operations done to it so gradients can be computed.',
			'',
			'Every tensor has a **shape**, a **dtype** (float32 by default for decimals, int64 for integers) and a **device** (`cpu` or `cuda`). Tensors must be on the same device to be combined. `.to(device)` returns a new tensor there.',
			'',
			'```python',
			'import torch',
			'',
			'a = torch.tensor([[1.0, 2.0], [3.0, 4.0]])',
			'print(a.shape, a.dtype, a.device)  # torch.Size([2, 2]) torch.float32 cpu',
			'device = "cuda" if torch.cuda.is_available() else "cpu"',
			'a = a.to(device)',
			'```',
			'',
			'**Autograd** is the engine that computes gradients (the slope of the loss with respect to each weight). Set `requires_grad=True` and PyTorch records every operation in a graph. `.backward()` walks that graph in reverse and fills `.grad`.',
			'',
			'```python',
			'w = torch.tensor(3.0, requires_grad=True)',
			'x = torch.tensor(2.0)',
			'loss = (w * x - 5) ** 2   # (6 - 5)^2 = 1',
			'loss.backward()',
			'print(w.grad)             # tensor(4.)  = 2 * (6 - 5) * x',
			'```',
			'',
			'Useful controls:',
			'',
			'- `torch.no_grad()` : do not record a graph. Use it for inference and for manual weight updates.',
			'- `t.detach()` : same data, cut off from the graph.',
			'- `.grad` **accumulates** across `backward()` calls, so it must be cleared between steps.',
			'- `torch.from_numpy(arr)` shares memory with the array. Going back, use `t.detach().cpu().numpy()`.',
			'',
			'**Common trap:** in-place changes (`w += 1`, `x.add_(1)`) on a tensor that needs grad raise an error, or silently break the graph if the old value was needed for backward. Prefer `w = w + 1`, or wrap manual updates in `with torch.no_grad():`.'
		)
	},
	{
		id: 'pa-pytorch-nn',
		title: 'nn.Module, losses and optimizers',
		level: 'basic',
		summary: 'Build a model with nn.Module, feed it with a DataLoader and train it with the standard loop.',
		scenes: ['pa-training-loop', 'pa-dataloader', 'pa-train-eval-mode'],
		notes: md(
			'Training a network in PyTorch uses five pieces:',
			'',
			'- **nn.Module**: a model. Layers assigned in `__init__` are registered, so `model.parameters()` finds their weights. `forward` says how data flows.',
			'- **Loss function**: scores predictions against labels (`nn.CrossEntropyLoss` for classes, `nn.MSELoss` for numbers). Cross entropy wants raw **logits**, not softmax output.',
			'- **Optimizer**: updates parameters from their gradients (`SGD`, `Adam`, `AdamW`). It is given `model.parameters()`.',
			'- **Dataset / DataLoader**: serve examples in shuffled **batches**.',
			'- **Modes**: `model.train()` enables dropout and batch-norm updates, `model.eval()` disables them.',
			'',
			'Below is a complete small example: it learns whether two inputs add up to a positive number. Each pass over the whole dataset is an **epoch**, and inside it the five steps of the loop (clear gradients, forward, loss, backward, step) run once per batch. `Adam` and `AdamW` adapt the step size per weight and are a safe default, while plain `SGD` is simpler but needs more tuning. At the end, `eval()` plus `torch.no_grad()` measures accuracy without training side effects.',
			'',
			'```python',
			'import torch',
			'from torch import nn',
			'from torch.utils.data import TensorDataset, DataLoader',
			'',
			'torch.manual_seed(0)',
			'X = torch.randn(256, 2)',
			'y = (X[:, 0] + X[:, 1] > 0).long()',
			'loader = DataLoader(TensorDataset(X, y), batch_size=32, shuffle=True)',
			'',
			'class Net(nn.Module):',
			'    def __init__(self):',
			'        super().__init__()',
			'        self.net = nn.Sequential(nn.Linear(2, 16), nn.ReLU(), nn.Linear(16, 2))',
			'',
			'    def forward(self, x):',
			'        return self.net(x)',
			'',
			'model = Net()',
			'loss_fn = nn.CrossEntropyLoss()',
			'opt = torch.optim.AdamW(model.parameters(), lr=1e-2)',
			'',
			'for epoch in range(5):',
			'    model.train()',
			'    for xb, yb in loader:',
			'        opt.zero_grad()',
			'        loss = loss_fn(model(xb), yb)',
			'        loss.backward()',
			'        opt.step()',
			'    print(epoch, loss.item())',
			'',
			'model.eval()',
			'with torch.no_grad():',
			'    acc = (model(X).argmax(dim=1) == y).float().mean()',
			'print(acc.item())',
			'```',
			'',
			'**Common trap:** a plain Python list of layers (`self.layers = [nn.Linear(...)]`) is not registered, so those weights are never trained. Use `nn.ModuleList` or `nn.Sequential`.'
		)
	},
	{
		id: 'pa-pytorch-training',
		title: 'Training well',
		level: 'mid',
		summary: 'Use GPUs, mixed precision, accumulation, schedules and checkpoints, and debug a loss that will not fall.',
		scenes: ['pa-grad-accumulation', 'pa-mixed-precision'],
		notes: md(
			'Real training adds a handful of habits around the basic loop.',
			'',
			'- **Device**: move the model once and each batch every step: `model.to(device)`, `xb = xb.to(device)`.',
			'- **Mixed precision**: run matmuls in 16-bit with `torch.autocast`. **bf16** has fp32\'s range and needs no scaler. **fp16** needs a `GradScaler` so tiny gradients do not underflow.',
			'- **Gradient accumulation**: add gradients over several micro-batches to imitate a bigger batch.',
			'- **Schedulers and warmup**: raise the learning rate slowly at first, then decay it.',
			'- **Gradient clipping**: cap the gradient norm to survive a bad batch.',
			'',
			'```python',
			'accum, warmup = 4, 100',
			'opt = torch.optim.AdamW(model.parameters(), lr=3e-4)',
			'sched = torch.optim.lr_scheduler.LambdaLR(opt, lambda s: min(1.0, (s + 1) / warmup))',
			'',
			'for i, (xb, yb) in enumerate(loader):',
			'    xb, yb = xb.to(device), yb.to(device)',
			'    with torch.autocast(device_type=device, dtype=torch.bfloat16):',
			'        loss = loss_fn(model(xb), yb) / accum',
			'    loss.backward()',
			'    if (i + 1) % accum == 0:',
			'        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)',
			'        opt.step()',
			'        sched.step()',
			'        opt.zero_grad()',
			'```',
			'',
			'**Checkpoints**: save `state_dict()` (just tensors), not the whole pickled model, and include the optimizer and step to resume.',
			'',
			'```python',
			'torch.save({"model": model.state_dict(), "opt": opt.state_dict()}, "ckpt.pt")',
			'state = torch.load("ckpt.pt")',
			'model.load_state_dict(state["model"])',
			'```',
			'',
			'**Reproducibility**: `torch.manual_seed(0)` fixes random initial weights and shuffling, but some GPU kernels remain nondeterministic.',
			'',
			'**Loss will not go down?** First **overfit one small batch**. If the model cannot memorise 8 examples, the bug is in code, labels, learning rate or a missing `zero_grad`, not in the amount of data.',
			'',
			'`torch.compile(model)` compiles the model into faster kernels with one line. For many GPUs, **DDP** copies the model to each GPU and averages gradients, while **FSDP** also shards parameters and optimizer state so models larger than one GPU fit.'
		)
	},
	{
		id: 'pa-frameworks',
		title: 'TensorFlow, Keras, JAX and ONNX',
		level: 'basic',
		summary: 'Know what the other frameworks are, how they differ from PyTorch and how to export a model with ONNX.',
		scenes: [],
		notes: md(
			'PyTorch is the default, but you will meet the others.',
			'',
			'- **TensorFlow**: Google\'s older framework. Strong in mobile and production tooling (TF Lite, TF Serving) and many legacy codebases.',
			'- **Keras**: a high-level API (`Sequential`, `compile`, `fit`) that now runs on several backends, so it is quick for small models.',
			'- **JAX**: NumPy-style arrays with function transforms: `jit` compiles, `grad` differentiates, `vmap` vectorises. It is **functional**: no hidden state, so parameters are passed in and returned.',
			'- **ONNX**: not a trainer but a portable file format, with ONNX Runtime to run it.',
			'',
			'PyTorch is **define-by-run** (eager): the graph is built while your normal Python executes, so `if`, loops and print debugging just work. This is why research and most LLM code, including the Hugging Face ecosystem, is written in PyTorch.',
			'',
			'```python',
			'import jax',
			'import jax.numpy as jnp',
			'',
			'@jax.jit',
			'def f(w, x):',
			'    return jnp.sum((w * x) ** 2)',
			'',
			'print(jax.grad(f)(jnp.array(3.0), jnp.array(2.0)))  # 24.0 = 2 * w * x^2',
			'```',
			'',
			'**Exporting to ONNX** lets you train in PyTorch and serve from another runtime or language without Python:',
			'',
			'```python',
			'import torch',
			'',
			'model.eval()',
			'dummy = torch.randn(1, 2)',
			'torch.onnx.export(',
			'    model, dummy, "model.onnx",',
			'    input_names=["x"], output_names=["logits"],',
			'    dynamic_axes={"x": {0: "batch"}},',
			')',
			'',
			'import onnxruntime as ort',
			'sess = ort.InferenceSession("model.onnx")',
			'logits = sess.run(None, {"x": dummy.numpy()})[0]',
			'```',
			'',
			'**Common trap:** export in `eval()` mode with an example input of the right shape, and mark the batch dimension dynamic, or the exported model only accepts one fixed batch size.'
		)
	},
	{
		id: 'pa-transformers',
		title: 'How transformers work',
		level: 'mid',
		summary: 'Follow text through tokens, embeddings, attention and the transformer block to next-token generation.',
		scenes: ['pa-attention', 'pa-transformer-block', 'pa-next-token', 'pa-kv-cache'],
		notes: md(
			'A **transformer** is the architecture behind modern LLMs. The path of a sentence:',
			'',
			'1. **Tokens**: text is split into pieces (words or sub-words) and mapped to integer ids.',
			'2. **Embeddings**: each id becomes a learned vector of numbers.',
			'3. **Positional information**: attention itself ignores order, so position is added to the vectors (learned or rotary encodings).',
			'4. **Blocks, repeated N times**: self-attention, an MLP, **residual** connections and normalisation.',
			'5. **Output**: scores for every token in the vocabulary, turned into probabilities by softmax.',
			'',
			'**Self-attention**: each token makes a **query**, **key** and **value**. The query is compared with every key, softmax makes weights, and the output is the weighted sum of values. **Multi-head** attention runs several of these in parallel so heads can learn different relations.',
			'',
			'```python',
			'import math',
			'import torch',
			'import torch.nn.functional as F',
			'',
			'def attention(q, k, v, causal=True):',
			'    # q, k, v: (batch, tokens, dim)',
			'    scores = q @ k.transpose(-2, -1) / math.sqrt(q.size(-1))',
			'    if causal:',
			'        n = scores.size(-1)',
			'        mask = torch.tril(torch.ones(n, n, dtype=torch.bool, device=scores.device))',
			'        scores = scores.masked_fill(~mask, float("-inf"))',
			'    return F.softmax(scores, dim=-1) @ v',
			'',
			'q = k = v = torch.randn(1, 5, 16)',
			'print(attention(q, k, v).shape)  # torch.Size([1, 5, 16])',
			'```',
			'',
			'**Encoder vs decoder**: encoder-only models (BERT style) see the whole text and suit classification and embeddings. **Decoder-only** models (GPT style) use a **causal mask**, so a token sees only earlier ones, and they generate text.',
			'',
			'**Generation** is a loop: run the model, take the probabilities for the next token, pick one (greedy or sampled), append it, repeat until an end token or the limit. The **context window** is the most tokens the model can attend to at once. A **KV cache** keeps each past token\'s keys and values so each step computes only the new token, at the cost of memory.'
		)
	},
	{
		id: 'pa-huggingface',
		title: 'Hugging Face ecosystem',
		level: 'mid',
		summary: 'Load tokenizers, models and datasets from the Hub and generate text with a few lines.',
		scenes: ['pa-hf-pipeline'],
		notes: md(
			'**Hugging Face** is the hub of open models, plus the libraries to use them.',
			'',
			'- **Hub**: a Git-like host for models, datasets and demos. Each model has a **model card** (what it is, data, limits) and a **licence**. Read both before shipping.',
			'- **transformers**: `AutoTokenizer`, `AutoModel...` classes and `pipeline`.',
			'- **tokenizers**: the fast tokenizer engine underneath.',
			'- **datasets**: load and map over large data without loading it all in RAM.',
			'- **accelerate**: runs the same training code on one GPU, many GPUs or mixed precision.',
			'- **evaluate**: metrics such as accuracy or F1.',
			'- **safetensors**: the default weight format. It stores raw tensors only, so loading cannot execute code like pickle can.',
			'',
			'Load a model and generate:',
			'',
			'```python',
			'from transformers import AutoTokenizer, AutoModelForCausalLM',
			'',
			'name = "gpt2"  # any causal language model on the Hub',
			'tok = AutoTokenizer.from_pretrained(name)',
			'model = AutoModelForCausalLM.from_pretrained(name)',
			'',
			'inputs = tok("Hello world", return_tensors="pt")',
			'out = model.generate(**inputs, max_new_tokens=20, do_sample=False)',
			'print(tok.decode(out[0], skip_special_tokens=True))',
			'```',
			'',
			'The shortcut for the same thing:',
			'',
			'```python',
			'from transformers import pipeline',
			'',
			'gen = pipeline("text-generation", model="gpt2")',
			'print(gen("Hello world", max_new_tokens=20)[0]["generated_text"])',
			'```',
			'',
			'The `Auto` class must match the task: `AutoModelForCausalLM` for GPT-style generation, `AutoModelForSequenceClassification` for labels. Always load the tokenizer from the same name as the model, because ids only make sense in one vocabulary.',
			'',
			'Big models: `from_pretrained(name, device_map="auto")` spreads layers across the available GPUs (and CPU if needed). Loading in half precision or in 4 or 8 bits (via a quantization config) cuts memory so larger models fit.',
			'',
			'Your own data: `load_dataset("json", data_files="data.jsonl")`.'
		)
	},
	{
		id: 'pa-finetuning',
		title: 'Fine-tuning and LoRA',
		level: 'advanced',
		summary: 'Decide between prompting, RAG and fine-tuning, then adapt a model cheaply with LoRA.',
		scenes: ['pa-lora'],
		notes: md(
			'**Pretraining** teaches a model language from huge text, and costs most of the money. You almost never do it. You adapt an existing model:',
			'',
			'- **Prompting**: change the instructions and examples. Cheapest, try it first.',
			'- **RAG**: retrieve fresh documents and put them in the prompt. Best for facts that change or are private.',
			'- **Fine-tuning**: change the weights. Best for style, format, a narrow task or consistent behaviour, not for adding up-to-date facts.',
			'',
			'**Full fine-tuning** updates every weight and stores gradients and optimizer state for all of them, so memory is several times the model size. **LoRA** (low-rank adaptation) freezes the weights and learns two thin matrices per layer, so the update is `W + B A` with a small rank r. Adapters are a tiny fraction of the model and files are small. **QLoRA** keeps the frozen base in 4-bit and trains adapters on top, so large models fit on one GPU.',
			'',
			'**SFT** (supervised fine-tuning) data is example conversations, often JSON lines:',
			'',
			'```json',
			'{"messages": [{"role": "user", "content": "Summarise: ..."}, {"role": "assistant", "content": "..."}]}',
			'```',
			'',
			'```python',
			'from datasets import load_dataset',
			'from peft import LoraConfig',
			'from trl import SFTConfig, SFTTrainer',
			'',
			'ds = load_dataset("json", data_files="train.jsonl", split="train")',
			'trainer = SFTTrainer(',
			'    model="Qwen/Qwen2.5-0.5B",',
			'    train_dataset=ds,',
			'    args=SFTConfig(output_dir="out", num_train_epochs=1, per_device_train_batch_size=4),',
			'    peft_config=LoraConfig(r=8, lora_alpha=16, target_modules="all-linear", task_type="CAUSAL_LM"),',
			')',
			'trainer.train()',
			'trainer.save_model("out/adapter")',
			'```',
			'',
			'Merge an adapter into the base to serve a normal model:',
			'',
			'```python',
			'from peft import AutoPeftModelForCausalLM',
			'',
			'merged = AutoPeftModelForCausalLM.from_pretrained("out/adapter").merge_and_unload()',
			'merged.save_pretrained("out/merged")',
			'```',
			'',
			'**Catastrophic forgetting**: training hard on a narrow task can erase general skills. Use a small learning rate, few epochs, LoRA, and mix in general data.',
			'',
			'**Evaluate** on held-out examples never used in training, against the base model and a prompted baseline. A falling training loss alone proves little.'
		)
	}
];

const t = (topic: string) => builder('PA', topic);

// ----- PyTorch tensors and autograd -----
const pt = t('pa-pytorch-tensors');
pt.add('basic', 'shape', "What does this print?",
	"torch.Size([3, 4])",
	["torch.Size([4, 3])", "torch.Size([12])", "torch.Size([3])"],
	"The .T attribute swaps the two dimensions of a 2-D tensor, so a (4, 3) tensor becomes (3, 4). It does not flatten or drop a dimension.",
	String.raw`x = torch.zeros(4, 3)
y = x.T
print(y.shape)`);
pt.add('basic', 'dtype', "What dtype does torch.tensor([1, 2, 3]) get by default?",
	"torch.int64",
	["torch.float32", "torch.int32", "torch.float64"],
	"Python ints become int64, while Python floats become float32, which is PyTorch's default float. Mixing the two kinds in math can raise dtype errors until you convert with .float().");
pt.add('basic', 'device', "What does t.to(\"cuda\") return?",
	"A new tensor on the GPU, leaving the original on its device",
	["Nothing returned, because it moves the original tensor there in place", "A view that shares memory between the CPU and the GPU", "A copy on the GPU, but only when requires_grad is set to True first"],
	"Tensor.to returns a tensor on the target device, so you must assign it: t = t.to(device). The original is not changed, and nothing is shared across devices. (nn.Module.to is the exception: it moves the module in place.)");
pt.add('basic', 'autograd', "What does this print?",
	"tensor(8.)",
	["tensor(4.)", "tensor(2.)", "None"],
	"The loss is (2w - 4)^2 with w = 3, so the inner value is 2. The derivative is 2 * 2 * 2 = 8. None would only appear if w did not require grad.",
	String.raw`w = torch.tensor(3.0, requires_grad=True)
loss = (w * 2 - 4) ** 2
loss.backward()
print(w.grad)`);
pt.add('basic', 'no-grad', "What does torch.no_grad() do?",
	"Stops recording operations, so no graph is built and memory is saved",
	["Sets requires_grad to False on every tensor in the program permanently", "Makes backward() faster by skipping the chain rule", "Switches dropout and batch norm to inference behaviour"],
	"no_grad is a context manager that turns off graph building inside its block, which is what you want for inference. It does not change tensor flags permanently, and eval() is the separate switch for dropout and batch norm.");
pt.add('mid', 'detach', "What does x.detach() return?",
	"A tensor sharing the same data, cut off from the graph",
	["A deep copy with its own separate memory and no graph attached", "The same tensor with requires_grad switched to False", "A tensor moved to the CPU with its gradient erased"],
	"detach gives a new tensor object that shares storage but has no history, so gradients stop there. Because the memory is shared, an in-place change to one shows up in the other. Use .clone() for an independent copy.");
pt.add('mid', 'in-place', "What happens when this runs?",
	"RuntimeError: a leaf tensor that requires grad cannot be changed in place",
	["w quietly becomes 2.0 and gradient tracking continues as normal", "w becomes 2.0 and requires_grad turns off by itself", "Only a warning is printed, and w silently stays at the value 1.0"],
	"In-place edits of a leaf that requires grad are blocked because they would corrupt the graph. For a manual update, do it under torch.no_grad(), or just let an optimizer do it.",
	String.raw`w = torch.tensor(1.0, requires_grad=True)
w += 1`);
pt.add('mid', 'numpy', "t has requires_grad=True and lives on the GPU. How do you get a NumPy array?",
	"t.detach().cpu().numpy()",
	["t.cpu().numpy(), moving it to the CPU is enough", "t.to(torch.float64).numpy()", "t.view(-1).numpy()"],
	"NumPy cannot hold graph history or GPU memory, so you must detach from the graph and move to the CPU first. Changing dtype or shape does not remove either problem.");

// ----- nn.Module, losses and optimizers -----
const pn = t('pa-pytorch-nn');
pn.add('basic', 'loop', "Which order is the standard training step?",
	"zero_grad, forward, loss, backward, step",
	["forward, step, backward, loss, zero_grad", "loss, forward, zero_grad, step, backward", "backward, forward, step, zero_grad, loss"],
	"Clear old gradients, run the model, compute the loss, call backward to fill .grad, then let the optimizer step. Every other order uses gradients before they exist or after they are stale.");
pn.add('basic', 'zero-grad', "This loop never calls opt.zero_grad(). What happens?",
	"Gradients pile up across iterations, so each update uses a growing sum",
	["PyTorch clears them automatically for you after every single opt.step()", "Training crashes with a shape error on the second iteration of the loop", "Only the gradient from the most recent batch is ever used in a step"],
	"backward() adds to .grad rather than replacing it, and step() does not clear it. Without zero_grad the updates mix in all earlier batches, and the loss usually behaves erratically.",
	String.raw`for xb, yb in loader:
    loss = loss_fn(model(xb), yb)
    loss.backward()
    opt.step()`);
pn.add('basic', 'eval-mode', "Which common layers behave differently in train() and eval()?",
	"Dropout and BatchNorm",
	["Linear and Conv2d", "ReLU and Softmax", "Embedding and LayerNorm"],
	"Dropout is active only in train mode, and BatchNorm switches from batch statistics to running averages. Linear, ReLU, Softmax and LayerNorm compute the same thing in both modes.");
pn.add('basic', 'loss', "What should the model output when using nn.CrossEntropyLoss?",
	"Raw logits, not softmax probabilities",
	["Probabilities that already sum to one", "One-hot encoded vectors for each class", "The class names as strings"],
	"CrossEntropyLoss applies log-softmax internally, so you hand it unnormalised scores and integer class indexes as targets. Adding your own softmax first applies it twice and hurts training.");
pn.add('basic', 'parameters', "Why do you pass model.parameters() to the optimizer?",
	"So it knows which tensors to update",
	["So it can compute the gradients by itself", "So it can move the model onto the GPU", "So it can switch the model into train mode"],
	"backward() computes gradients, and the optimizer only applies them to the tensors it was given. It does not run the model, move devices or change modes.");
pn.add('mid', 'modulelist', "How many tensors does model.parameters() yield here?",
	"None, because a plain list does not register its layers",
	["Four tensors in total: two weights and two biases", "Two tensors, one for each Linear layer", "Two, but only the weights"],
	"nn.Module registers layers assigned directly or inside nn.ModuleList, nn.Sequential or nn.ModuleDict. A normal Python list hides them, so the optimizer would see nothing to train.",
	String.raw`class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers = [nn.Linear(4, 4), nn.Linear(4, 2)]

model = Net()
print(len(list(model.parameters())))`);
pn.add('mid', 'shuffle', "Why use shuffle=True for training data but usually not for validation data?",
	"Training benefits from varied batches, while validation order does not matter",
	["Shuffling would make the evaluation metrics look higher on validation data", "Validation batches would otherwise run out of GPU memory during evaluation", "The optimizer needs shuffled data to compute gradients"],
	"Shuffling keeps batches from reflecting the order of the data, which helps training. Validation only averages a metric, so the order cannot change the result and fixed order is easier to debug.");

// ----- Training well -----
const ptr = t('pa-pytorch-training');
ptr.add('mid', 'accumulation', "You want an effective batch of 64 but only 16 samples fit. What do you do?",
	"Run backward on 4 micro-batches, then call step once",
	["Call step after every micro-batch with 4x the learning rate", "Call zero_grad before each backward, then step once", "Train 4 separate models and average them afterwards"],
	"Gradients add up across backward calls, so four backward calls on 16 samples approximate one on 64. Zeroing before each backward would discard the earlier pieces.");
ptr.add('mid', 'accumulation', "When accumulating over 4 micro-batches, why divide each loss by 4?",
	"So the summed gradients equal the average over the full batch",
	["To stop the loss from ever becoming negative during accumulation", "To make every backward pass run about four times faster", "Because the GPU hands back four duplicate copies of the loss value"],
	"Each micro-batch loss is already an average over its own samples. Adding four of those gradients would give a 4x larger gradient than a true batch average, so scale each loss by 1/4.");
ptr.add('mid', 'precision', "Why does fp16 usually need a GradScaler while bf16 usually does not?",
	"bf16 has the exponent range of fp32, so small gradients rarely underflow",
	["bf16 stores more mantissa bits than fp16, so its gradients are always more precise", "bf16 runs only on CPUs, where gradient scaling is simply not needed", "fp16 cannot represent negative gradient values"],
	"fp16 has a narrow range, so tiny gradients round to zero, and scaling the loss up avoids that. bf16 keeps fp32's range with fewer mantissa bits, so range is not the problem.");
ptr.add('mid', 'clipping', "What does torch.nn.utils.clip_grad_norm_(params, 1.0) do?",
	"Rescales gradients so their total norm is at most 1.0",
	["Sets every single gradient value to be at most 1.0, one by one", "Drops the largest one percent of the gradients on each step", "Limits the weights themselves to a norm of 1.0"],
	"It measures the combined norm of all gradients and shrinks them all by the same factor if it exceeds the limit, keeping their direction. Clip values is a different function, and weights are untouched.");
ptr.add('mid', 'debugging', "The loss will not go down. What is a good first debugging move?",
	"Try to overfit a single small batch; the loss should reach near zero",
	["Double the size of the dataset and train for many more epochs", "Switch to the biggest model that will fit in GPU memory", "Raise the learning rate by a factor of ten and run it again"],
	"If a model cannot memorise a handful of examples, the problem is in the code: wrong labels, a missing zero_grad, a bad loss or a broken learning rate. More data or a bigger model only hides it.");
ptr.add('mid', 'checkpoints', "Why save model.state_dict() instead of pickling the whole model object?",
	"It holds only tensors, so it survives code refactors",
	["It is the only format a GPU can read from disk", "It compresses the weights to 8-bit automatically", "Whole-model pickles cannot be loaded on the same machine"],
	"A state_dict is a plain mapping from names to tensors, so you rebuild the class and call load_state_dict. A whole-model pickle stores references to your class path, so renaming or moving code breaks loading.");
ptr.add('advanced', 'distributed', "What does DDP (DistributedDataParallel) do?",
	"Each GPU keeps a full model copy, trains on a data slice, and gradients are averaged",
	["It splits the layers of one single model across the GPUs, one layer per GPU", "It trains several different models and takes a vote on their predictions", "It copies all of the activations between neighbouring GPUs after every layer"],
	"DDP is data parallelism: the same model on every GPU, different batch slices, gradients averaged so all copies stay identical. Splitting layers is model or pipeline parallelism, and FSDP shards the state to save memory.");

// ----- TensorFlow, Keras, JAX and ONNX -----
const pf = t('pa-frameworks');
pf.add('basic', 'eager', "What does define-by-run mean in PyTorch?",
	"The graph is built as your Python runs, so if and for just work",
	["The graph is compiled once before any data is seen", "Layers are declared in a config file and run by another engine", "Every operation is queued and executed in one batch at the end"],
	"PyTorch records operations while normal Python executes, so control flow and print debugging behave as usual. Compile-first designs are the older static-graph style.");
pf.add('basic', 'onnx', "What is ONNX mainly for?",
	"A portable model file format that other runtimes can load",
	["A training library that replaces the optimizers that PyTorch provides", "A tokenizer file format that is shared by all language models", "A low-level GPU driver that speeds up the CUDA kernels"],
	"ONNX describes a model's graph and weights independent of the training framework, so ONNX Runtime and others can run it without Python or PyTorch. It does not train, tokenise or drive hardware.");
pf.add('mid', 'jax', "What does jax.jit do?",
	"Compiles a pure function with XLA so repeated calls run faster",
	["Moves the function onto a background thread automatically for you", "Converts a PyTorch module into a Keras layer", "Records gradients for every single tensor that is used inside it"],
	"jit traces a function once and compiles it, which works best when the function has no side effects. Gradients come from jax.grad, not jit.");

// ----- How transformers work -----
const ptf = t('pa-transformers');
ptf.add('mid', 'shapes', "What shape is scores here?",
	"(1, 5, 5)",
	["(1, 5, 16)", "(1, 16, 16)", "(5, 5)"],
	"Each of 5 tokens is compared with each of 5 tokens, so the score matrix is tokens x tokens per batch item. The embedding dimension 16 is summed away by the dot product.",
	String.raw`q = torch.randn(1, 5, 16)
k = torch.randn(1, 5, 16)
scores = q @ k.transpose(-2, -1)
print(scores.shape)`);
ptf.add('mid', 'scaling', "Why are attention scores divided by the square root of the key size?",
	"Dot products grow with size, which would push softmax toward saturation",
	["It is what makes all of the attention weights add up to exactly one", "It converts the scores into probabilities", "It reduces how many other tokens each token is allowed to attend to"],
	"With larger vectors the raw dot products get large, so softmax becomes nearly one-hot and gradients vanish. Scaling keeps them in a sensible range. The softmax is what makes the weights sum to one.");
ptf.add('mid', 'causal', "Why does a decoder-only model use a causal mask?",
	"So each token attends only to earlier tokens, as in generation",
	["To hide padding tokens from every other token", "To let every token see the future tokens for better accuracy", "To shrink the size of the vocabulary at each generation step"],
	"At generation time the future tokens do not exist yet, so training must not let a token peek at them. The mask sets later positions to minus infinity before softmax.");
ptf.add('basic', 'position', "Why do transformers need positional information?",
	"Attention on its own treats the tokens as an unordered set",
	["Embeddings cannot hold more than a single word at a time", "Softmax erases the original order of all of the scores", "Tokenizers drop word order while splitting"],
	"The attention operation gives the same result if tokens are shuffled, so order must be injected, using learned or rotary position encodings. Without it, dog bites man and man bites dog look identical.");
ptf.add('mid', 'residual', "What is the purpose of residual connections in a block?",
	"They give the signal and gradients a shortcut, so deep stacks train",
	["They reduce the number of attention heads that are needed", "They compress the activations before the MLP runs on them", "They remove the need for normalisation layers"],
	"Adding the input back to each sub-layer's output means the block only learns a correction, and gradients can flow straight through. Normalisation is still used alongside them.");
ptf.add('mid', 'kv-cache', "What does the KV cache store during generation?",
	"The keys and values of past tokens at every layer",
	["The probabilities of every vocabulary token seen so far", "The queries of all previous tokens", "The text produced by earlier requests"],
	"Past tokens' keys and values do not change, so they are kept and reused, and only the new token's are computed. Old queries are never needed again. The cost is memory that grows with context length.");
ptf.add('basic', 'context', "What is a model's context window?",
	"The most tokens it can take in and attend to at once",
	["The total number of words in its training data set", "The count of layers that each token passes through in turn", "The batch size it was trained with"],
	"It is a limit on the prompt plus generated tokens the model can consider together. Anything beyond it must be cut or summarised.");
ptf.add('mid', 'heads', "Why does a transformer use multiple attention heads?",
	"Each head can learn to focus on a different kind of relation",
	["Each head handles one separate language of a multilingual model", "Heads let different GPUs each hold their own separate tokens", "More heads make every score larger and more confident"],
	"Splitting the vector into several smaller attentions lets one head track, say, nearby words and another track the subject of a sentence. Their outputs are concatenated and mixed.");
ptf.add('advanced', 'encoder-decoder', "Which statement about encoder-only and decoder-only models is right?",
	"Encoder-only models suit understanding tasks, and decoder-only models generate text",
	["Decoder-only models are for classification, and encoder-only models write chat replies", "Both use causal masks, but encoders have fewer layers", "Encoders generate tokens, and decoders only produce embeddings"],
	"Encoders (BERT style) see the whole input both ways and produce rich representations. Decoders (GPT style) are masked so they can predict the next token, which makes them the base of chat models.");

// ----- Hugging Face ecosystem -----
const ph = t('pa-huggingface');
ph.add('basic', 'auto-classes', "Which class loads a GPT-style text generator?",
	"AutoModelForCausalLM",
	["AutoModelForSequenceClassification", "AutoModelForMaskedLM", "AutoModelForImageClassification"],
	"Causal language models predict the next token, which is what generate() needs. The others load models with heads for labels, masked-word filling or images.");
ph.add('basic', 'tokenizer', "Why must the tokenizer match the model?",
	"The ids only mean something under the vocabulary the model was trained on",
	["The tokenizer file also stores the weights that the model needs", "Different tokenizers always produce different tensor dtypes for ids", "The Hub refuses to let you download a mismatched pair of files"],
	"The model learned an embedding for each id, so a different vocabulary would feed it the wrong tokens, with no error. Load both from the same name with from_pretrained.");
ph.add('mid', 'safetensors', "Why is safetensors preferred over pickle-based checkpoint files?",
	"It stores only raw tensors, so loading cannot run arbitrary code",
	["It compresses all of the weights to a quarter of their size", "It is the only file format that PyTorch is able to write to disk", "It encrypts the weights so they stay private"],
	"Pickle can execute code when loaded, which is a risk with downloaded files. Safetensors holds tensors and metadata only, and also loads fast. It does not compress or encrypt.");
ph.add('mid', 'device-map', "What does from_pretrained(name, device_map=\"auto\") do?",
	"Places model layers across the available GPUs, and CPU if needed",
	["Chooses the best batch size to use for your hardware", "Downloads the smallest compatible model it can find on the Hub", "Converts the model to 8-bit automatically"],
	"With accelerate installed, it spreads the layers across devices so a model larger than one GPU can load. Precision and quantization are separate settings.");
ph.add('mid', 'licence', "Before using a Hub model in a product, what should you check?",
	"The licence and model card for allowed uses and known limits",
	["Whether its download count is higher than every other model", "That the repo name contains the word base", "Only that it loads without any errors on your own laptop"],
	"Open weights do not always mean free commercial use. The licence states the allowed uses and the model card describes training data, intended uses and limits.");
ph.add('mid', 'generate', "The prompt is 5 tokens and generation does not stop early. What does this print?",
	"torch.Size([1, 25])",
	["torch.Size([1, 20])", "torch.Size([20])", "torch.Size([1, 5, 20])"],
	"For causal models generate returns the prompt ids followed by the new ones, so 5 + 20 = 25 tokens for the one sequence. Slice off the prompt if you want only the new text.",
	String.raw`inputs = tok("a b c d e", return_tensors="pt")  # 5 tokens
out = model.generate(**inputs, max_new_tokens=20)
print(out.shape)`);

// ----- Fine-tuning and LoRA -----
const pft = t('pa-finetuning');
pft.add('advanced', 'approach', "A model must answer from private docs that change weekly. What is the best first approach?",
	"RAG: retrieve the current docs and place them in the prompt",
	["Run a full fine-tune every single week on the new documents", "Pretraining a brand new model from scratch on those docs", "Train a LoRA once and never update it again"],
	"Facts that change are better fetched at question time than baked into weights. Fine-tuning is slow to refresh and teaches style better than it teaches reliable facts.");
pft.add('advanced', 'lora', "Why is a LoRA adapter file small?",
	"It stores two low-rank matrices per layer instead of a full-size update",
	["It quantises all of the base weights down to a single bit each", "It keeps only the particular layers that changed the most", "It deletes every unused word of vocabulary from the model"],
	"The update to a d x d matrix is written as B x A with a small rank r, so storage is about 2 x d x r instead of d x d. The base model stays unchanged and separate.");
pft.add('advanced', 'lora-size', "A 1000 x 1000 weight gets a LoRA adapter of rank 8. How many adapter parameters does it add?",
	"16,000",
	["8,000", "1,000,000", "8,000,000"],
	"A is 1000 x 8 and B is 8 x 1000, so 8,000 + 8,000 = 16,000, which is 1.6 percent of the 1,000,000 weights in the frozen matrix.");
pft.add('advanced', 'qlora', "What does QLoRA add to plain LoRA?",
	"The frozen base model is stored in 4-bit while adapters train in higher precision",
	["A second adapter that is trained on the validation set", "Faster adapters that completely skip the backward pass step", "Query-based retrieval during training"],
	"Quantising the frozen base cuts memory so big models fit on one GPU, and the small adapters are still trained in higher precision. It is about memory, not retrieval or skipping backward.");
pft.add('advanced', 'forgetting', "What is catastrophic forgetting?",
	"Fine-tuning degrades abilities the model had before",
	["The optimizer losing all of its saved state after a crash", "A tokenizer silently dropping rare words at model load time", "The loss turning into NaN because of a very high learning rate"],
	"Updating weights for a narrow task can overwrite general skills. LoRA, small learning rates, few epochs and mixing in general data all reduce it.");
pft.add('advanced', 'evaluation', "What is the best way to judge a fine-tune?",
	"Compare it with the base model on held-out examples it never trained on",
	["Look only at how low the final training loss ended up", "Try a few hand-picked prompts copied from the training set", "Measure the perplexity on the very same training data"],
	"Training loss and training prompts only show memorisation. A held-out set, ideally against the base model and a well-prompted baseline, shows whether the tune really helped.");
pft.add('advanced', 'merge', "What does merge_and_unload() do on a PEFT LoRA model?",
	"Folds the adapter into the base weights and returns a normal model",
	["Deletes the base weights and keeps only the small adapter files", "Merges two separate adapters that were trained on different tasks", "Uploads the trained adapter to the Hugging Face Hub for sharing"],
	"It computes W + BA for each adapted layer and removes the adapter modules, so inference costs the same as the base model with no extra layers.");

export const banks: { out: Question[] }[] = [pt, pn, ptr, pf, ptf, ph, pft];
