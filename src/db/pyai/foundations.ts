import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

export const topics: DbTopic[] = [
	// ───────────────────────── Roadmap ─────────────────────────
	{
		id: 'pa-roadmap',
		title: 'The AI engineer path',
		level: 'basic',
		summary: 'Understand what the AI-related roles do, in what order to learn the tools, and how the main Python libraries relate to each other.',
		scenes: ['pa-ml-map'],
		notes: md(
			'"AI engineer" is a family of jobs that overlap a lot. Roughly:',
			'',
			'- **ML engineer**: trains, evaluates and ships models, often on tabular or text data. Strong on pipelines and testing.',
			'- **Applied scientist**: picks or adapts methods for a product problem, runs experiments, reads papers. More maths and statistics.',
			'- **LLM / AI engineer**: builds products on top of existing language models: prompts, retrieval (RAG), tools, agents, evals. Closest to ordinary backend work.',
			'- **MLOps engineer**: deploys, monitors and versions models and data: serving, GPUs, queues, dashboards.',
			'',
			'**A sensible order to learn**',
			'',
			'1. Python you can read fluently, plus tooling (environments, typing).',
			'2. NumPy and pandas: arrays and tables.',
			'3. Machine-learning basics with scikit-learn: splits, metrics, overfitting.',
			'4. PyTorch: tensors, gradients, training loops.',
			'5. Transformers and Hugging Face: using and fine-tuning pretrained models.',
			'6. LLM apps: embeddings, RAG, tool use, agents.',
			'7. Evals, serving and MLOps: measure quality, then make it fast and reliable.',
			'',
			'**What to skip at first**: deriving every algorithm by hand, writing custom GPU kernels, and reading every new paper. Learn the loop "load data, split, train, measure" well before any of that.',
			'',
			'**How the libraries relate**: Python is the glue, NumPy supplies arrays, pandas wraps arrays in tables, scikit-learn learns from them, PyTorch gives GPU tensors and automatic gradients, and Hugging Face ships pretrained PyTorch models. Here is the whole idea in a few lines:',
			'',
			'```python',
			'import pandas as pd',
			'from sklearn.linear_model import LogisticRegression',
			'',
			'df = pd.DataFrame({"hours": [1, 2, 3, 4, 5, 6], "passed": [0, 0, 0, 1, 1, 1]})',
			'model = LogisticRegression().fit(df[["hours"]], df["passed"])',
			'print(model.predict(pd.DataFrame({"hours": [2.0, 5.0]})))  # [0 1]',
			'```',
			'',
			'The table is pandas, the numbers underneath are NumPy arrays, and the learning is scikit-learn.'
		)
	},

	// ───────────────────────── Python environment ─────────────────────────
	{
		id: 'pa-python-env',
		title: 'Python tooling for ML',
		level: 'basic',
		summary: 'Set up reproducible Python projects with environments, lock files, typed configs, and know why GPU packages make installs tricky.',
		scenes: [],
		notes: md(
			'ML projects depend on large, version-sensitive packages, so tooling matters more than in a typical script.',
			'',
			'- **Virtual environment**: a private folder of packages for one project, so upgrading NumPy for project A cannot break project B.',
			'- **uv or pip + pyproject.toml**: `pyproject.toml` lists your dependencies. A lock file (such as `uv.lock`) records the exact resolved versions so a teammate or server gets the same install.',
			'- **Jupyter vs scripts**: notebooks are great for exploring data and plotting. Move working logic into `.py` modules so it can be tested, imported and run in CI. Before trusting a notebook, restart the kernel and run all cells top to bottom, because out-of-order cells hide bugs.',
			'- **Type hints, dataclasses and pydantic**: hints document shapes of data. A dataclass is a plain typed container. pydantic validates and converts input at runtime, which is why LLM and API libraries use it.',
			'- **async**: `asyncio` helps when you wait on many network calls, such as parallel LLM requests. It does not speed up number crunching.',
			'- **GPU wheels**: PyTorch builds for GPUs must match your CUDA runtime and driver, and often come from a separate package index. This is the most common reason an ML install breaks.',
			'- **Reproducibility**: pin versions, and set seeds for every generator you use.',
			'',
			'```bash',
			'uv init demo && cd demo',
			'uv add numpy pandas scikit-learn',
			'uv run python train.py',
			'```',
			'',
			'```python',
			'import random',
			'import numpy as np',
			'from dataclasses import dataclass',
			'from pydantic import BaseModel',
			'',
			'@dataclass',
			'class Config:',
			'    lr: float = 1e-3',
			'    epochs: int = 5',
			'    seed: int = 42',
			'',
			'class Row(BaseModel):',
			'    text: str',
			'    label: int',
			'',
			'cfg = Config()',
			'random.seed(cfg.seed)',
			'rng = np.random.default_rng(cfg.seed)   # NumPy has its own generator',
			'print(Row(text="hi", label="1"))        # "1" is coerced to the int 1',
			'```',
			'',
			'In PyTorch you also call `torch.manual_seed(seed)`. Some GPU operations stay non-deterministic unless you ask for deterministic algorithms, so "same seed" reduces variation but does not always remove it.'
		)
	},

	// ───────────────────────── NumPy ─────────────────────────
	{
		id: 'pa-numpy',
		title: 'NumPy arrays',
		level: 'basic',
		summary: 'Work with ndarrays: shape, dtype, axis, broadcasting, views, and why vectorised code beats Python loops.',
		scenes: ['pa-broadcasting', 'pa-vectorize'],
		notes: md(
			'NumPy provides the **ndarray**: a grid of numbers of one type stored in one contiguous block of memory. pandas, scikit-learn and PyTorch all build on the same idea.',
			'',
			'- **shape**: sizes along each axis, e.g. `(3, 4)` is 3 rows and 4 columns.',
			'- **dtype**: the number type (`int64`, `float32`...). Mixed operations upcast: int divided by int gives float64.',
			'- **axis**: the dimension an operation collapses. `sum(axis=0)` sums down the rows and leaves one value per column.',
			'- **Vectorisation**: write `a * 2` or `a.sum()` instead of a Python loop. The loop then runs in compiled code.',
			'- **Broadcasting**: arrays with different shapes combine when each pair of sizes (compared from the right) is equal or 1. The size-1 axis is virtually stretched.',
			'- **Views vs copies**: basic slicing returns a **view** sharing memory, so writing to it changes the original. Fancy indexing (an index list or a boolean mask) returns a **copy**. Use `.copy()` when you need independence.',
			'- **Matrix multiply**: `a @ b` needs the inner sizes to match: `(2, 3) @ (3, 4)` gives `(2, 4)`.',
			'',
			'```python',
			'import numpy as np',
			'',
			'a = np.arange(12).reshape(3, 4)',
			'print(a.shape, a.dtype)          # (3, 4) int64 (platform dependent)',
			'print(a.sum(axis=0))             # [12 15 18 21]  one value per column',
			'print(a.mean(axis=1))            # [1.5 5.5 9.5]  one value per row',
			'',
			'col = np.array([[10], [20], [30]])    # shape (3, 1)',
			'row = np.array([1, 2, 3, 4])          # shape (4,)',
			'print((col + row).shape)              # (3, 4) by broadcasting',
			'',
			'b = a[:, 1]          # a view of column 1',
			'b[0] = 99',
			'print(a[0, 1])       # 99, the original changed',
			'',
			'x = np.random.default_rng(0).normal(size=1_000_000)',
			'print((x * 2).sum() == 2 * x.sum())   # use array ops, not a for loop',
			'```',
			'',
			'The last comparison may print False because of float rounding. That is also a lesson: compare floats with `np.allclose`.',
			'',
			'**Debugging tip**: when something fails, print `.shape` and `.dtype` of every array involved. Most ML bugs are shape bugs.'
		)
	},

	// ───────────────────────── pandas ─────────────────────────
	{
		id: 'pa-pandas',
		title: 'pandas for tables',
		level: 'basic',
		summary: 'Load, select, clean, group and join tabular data with pandas, and know when Polars or a database fits better.',
		scenes: ['pa-groupby'],
		notes: md(
			'pandas gives you two types: a **Series** (one labelled column) and a **DataFrame** (a table of Series sharing an index). Think of a DataFrame as a spreadsheet or a SQL table you can script.',
			'',
			'- **Select**: `df["col"]`, `df[["a", "b"]]`, a filter with a boolean mask `df[df["amount"] > 100]`, and `.loc` (by label) or `.iloc` (by position).',
			'- **groupby**: split rows by key, apply a function, combine the results (see the animation).',
			'- **merge**: a SQL-style join: `orders.merge(customers, left_on="customer_id", right_on="id", how="left")` keeps every order.',
			'- **Missing data**: NaN marks a missing value. `isna()` finds them, `fillna()` fills them, `dropna()` removes rows. Aggregations such as `mean()` skip NaN by default.',
			'- **Cleaning**: fix dtypes with `astype` and `pd.to_datetime`, trim strings with `.str`, drop duplicates with `drop_duplicates()`.',
			'- **Memory**: use `category` for repeated strings and smaller numeric dtypes. Check with `df.info(memory_usage="deep")`.',
			'- **Scaling limits**: pandas works in memory on one core for most operations. When data no longer fits comfortably, look at **Polars** (multi-threaded, lazy query plans), DuckDB, or do the work inside the database.',
			'',
			'```python',
			'import pandas as pd',
			'',
			'orders = pd.DataFrame({',
			'    "customer_id": [1, 2, 1, 3],',
			'    "amount": [100, 250, None, 80],',
			'})',
			'customers = pd.DataFrame({"id": [1, 2], "name": ["Asha", "Ben"]})',
			'',
			'orders["amount"] = orders["amount"].fillna(orders["amount"].median())',
			'merged = orders.merge(customers, left_on="customer_id", right_on="id", how="left")',
			'print(merged[["name", "amount"]])',
			'',
			'totals = merged.groupby("name", dropna=False)["amount"].sum()',
			'print(totals)',
			'```',
			'',
			'Customer 3 has no match, so `name` is NaN for that row. `dropna=False` keeps that group in the result instead of silently dropping it.',
			'',
			'Avoid `for` loops over rows (`iterrows`). Prefer column operations and `groupby`, which run in compiled code.'
		)
	},

	// ───────────────────────── Maths ─────────────────────────
	{
		id: 'pa-math-for-ml',
		title: 'Maths you actually need',
		level: 'mid',
		summary: 'Build intuition for vectors, similarity, gradients, probability, softmax and cross-entropy with tiny NumPy examples.',
		scenes: ['pa-gradient-descent'],
		notes: md(
			'You do not need a maths degree. You need a handful of ideas and the habit of checking them in code.',
			'',
			'- **Vectors and dot product**: a vector is a list of numbers, such as an embedding. The dot product multiplies matching entries and adds them. Large when two vectors point the same way.',
			'- **Cosine similarity**: the dot product divided by both lengths. It is near 1 for the same direction, 0 for unrelated, -1 for opposite. Search over embeddings uses it.',
			'- **Matrices as transformations**: multiplying by a matrix turns one vector into another. A neural-network layer is mostly `x @ W + b`.',
			'- **Derivative and gradient**: the slope of the loss with respect to each weight. Training nudges each weight against its slope (gradient descent). The learning rate scales the step.',
			'- **Chain rule**: the derivative of nested functions is a product of local derivatives. Backpropagation applies it layer by layer so PyTorch can compute all gradients automatically.',
			'- **Probability and expectation**: a distribution says how likely each outcome is. The expectation is the probability-weighted average.',
			'- **Mean and variance**: centre and spread. Standardising a feature subtracts the mean and divides by the standard deviation.',
			'- **Softmax and cross-entropy**: softmax turns raw scores (logits) into probabilities that sum to 1. Cross-entropy loss is minus the log of the probability given to the true class, so confident wrong answers are punished hard.',
			'',
			'```python',
			'import numpy as np',
			'',
			'a = np.array([1.0, 2.0, 3.0])',
			'b = np.array([2.0, 4.0, 6.0])',
			'cos = a @ b / (np.linalg.norm(a) * np.linalg.norm(b))',
			'print(round(cos, 3))                # 1.0, same direction',
			'',
			'def softmax(z):',
			'    z = z - z.max()                 # subtract the max for numerical stability',
			'    e = np.exp(z)',
			'    return e / e.sum()',
			'',
			'p = softmax(np.array([2.0, 1.0, 0.1]))',
			'print(p.round(2), p.sum())          # [0.66 0.24 0.1 ] 1.0',
			'print(-np.log(p[0]))                # cross-entropy if class 0 is correct, about 0.42',
			'',
			'w, lr = 0.0, 0.1                    # minimise (w - 3) ** 2',
			'for _ in range(50):',
			'    w -= lr * 2 * (w - 3)           # gradient is 2 * (w - 3)',
			'print(round(w, 3))                  # 3.0',
			'```'
		)
	},

	// ───────────────────────── scikit-learn ─────────────────────────
	{
		id: 'pa-sklearn',
		title: 'scikit-learn workflow',
		level: 'basic',
		summary: 'Follow the standard fit, predict and evaluate loop with pipelines and cross-validation, and avoid overfitting and data leakage.',
		scenes: ['pa-overfit', 'pa-cross-validation', 'pa-confusion-matrix', 'pa-data-leakage'],
		notes: md(
			'scikit-learn gives every model the same small interface, so swapping algorithms is usually a one-line change.',
			'',
			'- **fit / predict / transform**: `fit(X, y)` learns from data. `predict(X)` outputs labels or numbers. Preprocessors have `transform(X)`. Learn statistics with `fit` on training data only.',
			'- **Split**: `train_test_split` holds data back. Use `stratify=y` for classification so class ratios stay equal.',
			'- **Pipeline**: chains preprocessing and a model into one object, so the same steps run in training and prediction and cross-validation refits them safely.',
			'- **Cross-validation**: train and validate on rotating folds for a steadier estimate than one split.',
			'- **Overfitting vs underfitting**: overfit means great on training, poor on new data. Underfit means poor on both.',
			'- **Metrics**: accuracy misleads on imbalanced classes. Use precision, recall, F1, or ROC-AUC (how well scores rank positives above negatives). For numbers, MAE (average absolute error) and RMSE (punishes large errors more).',
			'- **Data leakage**: any information from the test set, or from the future, reaching training. Fitting a scaler before splitting is the classic case.',
			'- **Tabular data**: gradient-boosted trees (XGBoost, LightGBM, or scikit-learn\'s HistGradientBoosting) are often a stronger first model than deep learning. Neural networks shine on images, audio and text.',
			'',
			'```python',
			'from sklearn.datasets import load_breast_cancer',
			'from sklearn.model_selection import train_test_split, cross_val_score',
			'from sklearn.pipeline import make_pipeline',
			'from sklearn.preprocessing import StandardScaler',
			'from sklearn.linear_model import LogisticRegression',
			'from sklearn.metrics import classification_report',
			'',
			'X, y = load_breast_cancer(return_X_y=True)',
			'X_train, X_test, y_train, y_test = train_test_split(',
			'    X, y, test_size=0.2, stratify=y, random_state=42',
			')',
			'',
			'model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))',
			'print(cross_val_score(model, X_train, y_train, cv=5).mean())',
			'',
			'model.fit(X_train, y_train)',
			'print(classification_report(y_test, model.predict(X_test)))',
			'```',
			'',
			'Tune with cross-validation on the training set, then look at the test set once at the end.'
		)
	},

	// ───────────────────────── EDA ─────────────────────────
	{
		id: 'pa-data-viz-eda',
		title: 'Plotting and exploring data',
		level: 'mid',
		summary: 'Explore a dataset with Matplotlib, seaborn and plotly, spot class imbalance, and make train, validation and test splits correctly.',
		scenes: ['pa-train-test-split'],
		notes: md(
			'Exploratory data analysis (EDA) means looking at the data before modelling. Ten minutes here prevents days of confusion later.',
			'',
			'- **Matplotlib** is the base plotting library. **seaborn** adds statistical charts with nicer defaults on top of it. **plotly** makes interactive charts for the browser.',
			'- **First checks**: shape, dtypes, missing values per column, duplicate rows, and the target distribution (`value_counts`).',
			'- **What to plot first**: a histogram for each numeric column, a box plot of a feature split by the label, a bar chart of category counts, and a correlation heatmap for numeric features.',
			'- **Class imbalance**: if 99 of 100 rows are one class, accuracy is useless. Choose recall, precision, F1 or PR-AUC, use `stratify`, and consider class weights.',
			'- **Splits done right**: train for fitting, validation for choosing settings, test for one final estimate. For time-ordered data split by time, never randomly. Keep groups, such as all rows of one user, in the same split.',
			'- **Stay honest**: let EDA that shapes your features look at training data only, so decisions are not informed by the test set.',
			'',
			'```python',
			'import pandas as pd',
			'import matplotlib.pyplot as plt',
			'import seaborn as sns',
			'from sklearn.model_selection import train_test_split',
			'',
			'df = pd.read_csv("data.csv")          # your own file with "price" and "label" columns',
			'print(df.shape)',
			'print(df.isna().mean().sort_values(ascending=False).head())',
			'print(df["label"].value_counts(normalize=True))',
			'',
			'fig, axes = plt.subplots(1, 2, figsize=(10, 4))',
			'sns.histplot(df["price"], ax=axes[0])',
			'sns.boxplot(x="label", y="price", data=df, ax=axes[1])',
			'plt.show()',
			'',
			'train, test = train_test_split(df, test_size=0.2, stratify=df["label"], random_state=42)',
			'train, val = train_test_split(train, test_size=0.25, stratify=train["label"], random_state=42)',
			'# 60 percent train, 20 percent validation, 20 percent test',
			'```'
		)
	}
];

// ───────────────────────── Quiz ─────────────────────────
// Each topic has its own id prefix so question ids stay unique across banks.
const t = (topic: string, prefix: string) => builder('PA' + prefix, topic);

const r = t('pa-roadmap', 'R');
r.add('basic', 'roles', "Which role mostly builds products on top of existing language models, using prompts, retrieval and tools?",
	"An LLM or AI engineer",
	["A research scientist inventing new network architectures", "An MLOps engineer who owns the GPU hardware", "A data analyst who builds dashboards in SQL"],
	"LLM or AI engineers assemble applications from existing models, which is close to backend work. Research scientists create new methods, MLOps engineers operate deployments, and analysts mostly report on data.");
r.add('basic', 'order', "Which learning order is the most sensible for a backend developer moving into AI?",
	"Python tooling, NumPy and pandas, ML basics, PyTorch, transformers, then LLM apps and evals",
	["PyTorch first, then NumPy, then Python basics, then classic ML, then transformers", "Transformers first, then NumPy and pandas, then PyTorch, then Python tooling, and finally ML basics", "LLM agents first, then NumPy, then Python basics, then evaluation metrics"],
	"Each step uses the one before it: arrays feed models, models need metrics, and deep learning builds on both. Starting at the top leaves gaps that surface as confusing shape and data errors later.");
r.add('basic', 'map', "How do scikit-learn and PyTorch relate?",
	"They are separate libraries: scikit-learn for classic models, PyTorch for neural networks",
	["scikit-learn is built on top of PyTorch and uses its GPU tensors", "PyTorch is a plugin that only works inside scikit-learn pipelines", "They are the same library, published under two names, one for CPU use and one for GPU use only"],
	"scikit-learn works on NumPy arrays with classic algorithms such as linear models and trees. PyTorch provides GPU tensors and automatic gradients for deep learning. Neither one depends on the other.");
r.add('basic', 'skip', "Which of these can a beginner safely skip at first?",
	"Writing custom GPU kernels",
	["Splitting data into train and test sets", "Checking array shapes while debugging", "Choosing a metric that fits the problem"],
	"Kernel writing is a specialist topic. Splitting, shape checks and metrics are core habits that you need from your first model.");

const e = t('pa-python-env', 'E');
e.add('basic', 'venv', "Why use a separate virtual environment for each project?",
	"Each project keeps its own package versions, so upgrades in one cannot break another",
	["It makes the Python interpreter run the code faster after compiling it", "It is required before Python can import its own standard library modules", "It lets one project edit the installed packages of every other project on the machine at once"],
	"A virtual environment isolates installed packages per project. It does not change speed, it is not needed for the standard library, and it prevents projects from sharing packages, not the reverse.");
e.add('basic', 'lock', "What does a lock file such as uv.lock give you?",
	"The exact resolved versions of every dependency, so installs are repeatable",
	["A list of only the modules your code imports directly", "Encryption of your source code for deployment", "Automatic upgrades to the newest compatible release whenever one is published upstream"],
	"pyproject.toml states what you want, usually as version ranges. The lock file records what was actually chosen, including indirect dependencies, so a teammate or server gets the same install.");
e.add('basic', 'dataclass', "What does this code print?",
	"Point(x=3, y=0)",
	["Point(3)", "Point(x=3)", "TypeError: missing argument y"],
	"A dataclass generates __init__ and __repr__. The y field has a default of 0, so Point(3) sets x to 3 and y to 0, and the repr lists field names and values.",
	String.raw`from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int = 0

print(Point(3))`);
e.add('mid', 'pydantic', "What does pydantic add over a plain dataclass?",
	"Runtime validation and coercion of input data using the type hints",
	["Faster attribute access through compiled slots", "Automatic database migrations for the declared fields", "Static type checking of the whole project before the program ever starts"],
	"Plain dataclass hints are not enforced when the program runs. pydantic checks and converts incoming data such as JSON, which is why API and LLM libraries use it. Static checking is the job of tools like mypy.");
e.add('mid', 'async', "When does asyncio help most in an AI application?",
	"When waiting on many network calls, like parallel LLM requests",
	["When a tight loop does heavy matrix maths on one CPU core for minutes", "When you want training to use several CPU cores", "When a model forward pass must run faster on the GPU"],
	"asyncio overlaps time spent waiting on I/O within one thread. It does not speed up computation, add cores, or accelerate GPU work.");
e.add('mid', 'cuda', "Why are GPU builds of PyTorch trickier to install than pure Python packages?",
	"The build must match your CUDA runtime and driver, and may live on a separate index",
	["PyTorch can only be installed from source and needs a compiler on every machine you deploy to", "GPU builds are distributed only through conda and never through pip", "pip refuses to install any package that is larger than a fixed size"],
	"GPU wheels bundle or depend on CUDA libraries, so versions of the build, the CUDA runtime and the driver must be compatible, and the right wheel often comes from a specific index URL. Pip and wheels work fine.");
e.add('advanced', 'seed', "You call random.seed(0) but PyTorch training still gives different results each run. What is the most likely missing piece?",
	"NumPy and PyTorch have their own random generators that also need seeding",
	["random.seed only takes effect on Linux servers, never on macOS or on Windows laptops", "Seeds are ignored unless the code runs inside Jupyter", "Python hashes lists differently on every import of a module"],
	"random.seed controls only the standard library generator. Seed NumPy (default_rng or np.random.seed) and torch.manual_seed as well, and note that some GPU operations are non-deterministic unless you request deterministic algorithms.");

const n = t('pa-numpy', 'N');
n.add('basic', 'shape', "What does this print?",
	"(3, 4)",
	["(4, 3)", "(12,)", "(3, 4, 1)"],
	"arange(12) has 12 items and reshape(3, 4) arranges them as 3 rows and 4 columns, so the shape is (3, 4). The shape lists rows first.",
	String.raw`import numpy as np

a = np.arange(12).reshape(3, 4)
print(a.shape)`);
n.add('basic', 'broadcast', "What is the shape of the result?",
	"(3, 4)",
	["(3, 1)", "(1, 4)", "It raises a ValueError"],
	"Shapes are compared from the right: 1 vs 4 gives 4, and 3 vs 1 gives 3. Size-1 axes are stretched, so the result is (3, 4).",
	String.raw`import numpy as np

x = np.ones((3, 1)) + np.ones((1, 4))
print(x.shape)`);
n.add('basic', 'vectorise', "Why is data.sum() usually much faster than a Python for loop over the same array?",
	"The loop runs in compiled code over contiguous memory, not in Python",
	["NumPy skips checking the values to save time", "It first converts the array to a Python list, which is internally optimised", "It automatically runs the loop on the GPU"],
	"A Python loop pays interpreter overhead for each element. A NumPy call does the whole loop in C over one block of same-typed values. NumPy does not skip work, convert to lists, or use the GPU by default.");
n.add('mid', 'view', "What does this print?",
	"[ 0 99  2  3  4]",
	["[0 1 2 3 4] (unchanged)", "[99  1  2  3  4]", "[ 0  1  2 99  4]"],
	"Basic slicing returns a view that shares memory with the original. b[0] is a[1], so assigning 99 changes a[1].",
	String.raw`import numpy as np

a = np.arange(5)
b = a[1:4]
b[0] = 99
print(a)`);
n.add('mid', 'axis', "What does this print?",
	"[5 7 9]",
	["[ 6 15]", "21", "[[1 2 3] [4 5 6]]"],
	"axis=0 collapses the rows, so each column is summed: 1+4, 2+5, 3+6. Summing along axis=1 would give [6 15], and no axis would give 21.",
	String.raw`import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
print(a.sum(axis=0))`);
n.add('mid', 'dtype', "What dtype is printed?",
	"float64",
	["int64, since both inputs are integers", "int32", "object"],
	"True division of an integer array always produces floating point values, so the result is float64 even though the inputs are integers.",
	String.raw`import numpy as np

x = np.array([1, 2, 3]) / 2
print(x.dtype)`);
n.add('mid', 'copy', "Which operation returns a copy instead of a view?",
	"Fancy indexing with a list of positions",
	["Basic slicing with a start and a stop, like a[0:2]", "Reshaping a contiguous array", "Transposing with a.T"],
	"Indexing with a list or a boolean mask builds a new array. Slices, reshape on contiguous data and transposes reuse the same memory, so writing through them changes the original.");
n.add('advanced', 'matmul', "a has shape (2, 3) and b has shape (3, 4). What is the shape of a @ b?",
	"(2, 4)",
	["(3, 3)", "(2, 3, 4)", "It raises a ValueError because the shapes differ"],
	"Matrix multiplication needs the inner sizes to match (3 and 3) and keeps the outer ones, giving (2, 4). The shapes differing is fine here.");

const p = t('pa-pandas', 'P');
p.add('basic', 'filter', "What does this print?",
	"['Delhi', 'Pune']",
	["['Pune', 'Delhi']", "['Pune']", "['Pune', 'Delhi', 'Pune']"],
	"The mask keeps rows with amount above 120, which are rows 1 and 2. Selecting the city column returns Delhi then Pune in row order.",
	String.raw`import pandas as pd

df = pd.DataFrame({"city": ["Pune", "Delhi", "Pune"], "amount": [100, 250, 150]})
print(df[df["amount"] > 120]["city"].tolist())`);
p.add('basic', 'groupby', "What does this print?",
	"{'Delhi': 250, 'Pune': 250}",
	["{'Pune': 250, 'Delhi': 250} (first-seen order)", "{'Pune': 100, 'Delhi': 250}", "{'Delhi': 250, 'Pune': 150}"],
	"Pune appears twice (100 + 150 = 250) and Delhi once (250). groupby sorts keys by default, so Delhi comes first.",
	String.raw`import pandas as pd

df = pd.DataFrame({"city": ["Pune", "Delhi", "Pune"], "amount": [100, 250, 150]})
print(df.groupby("city")["amount"].sum().to_dict())`);
p.add('basic', 'nan', "A column has some NaN values. What does df['age'].mean() do with them by default?",
	"Skips them and averages only the non-missing values",
	["Returns NaN because one missing value spoils the sum", "Counts each NaN as zero in the sum and in the count", "Raises ValueError until you fill the missing values"],
	"pandas aggregations skip NaN by default (skipna=True). Returning NaN is the plain NumPy behaviour, which is a common source of confusion.");
p.add('mid', 'merge', "orders has a customer_id column and customers has id and name. Which join keeps every order even when its customer is missing?",
	"A left merge with orders on the left",
	["An inner merge on customer_id and id", "An outer merge that drops unmatched rows afterwards", "A concat along axis=0 of the two tables"],
	"A left join keeps all rows of the left table and fills the right-side columns with NaN where there is no match. An inner join drops unmatched orders, and concat stacks rows rather than matching keys.");
p.add('mid', 'copy', "What is SettingWithCopyWarning telling you?",
	"You may be assigning into a temporary copy, not the original frame",
	["A column was assigned a value whose dtype could not be cast to the column's own dtype", "The index contains duplicate labels after the assignment", "The frame is too large to be copied into memory"],
	"Chained indexing such as df[mask]['col'] = value can write into an intermediate copy. Use a single .loc call, like df.loc[mask, 'col'] = value, so the intent is unambiguous.");
p.add('advanced', 'polars', "When does it make sense to look at Polars instead of pandas?",
	"When data is large or speed matters and you want multi-threaded, lazy queries",
	["When you need charts, since pandas cannot draw any", "When rows must be labelled with strings instead of numbers", "When the data contains missing values, which pandas cannot represent in any column type"],
	"Polars is built for multi-core execution and lazy query optimisation, which helps on bigger data. pandas can hold missing values, string labels, and plot through Matplotlib.");

const m = t('pa-math-for-ml', 'M');
m.add('basic', 'dot', "What does this print?",
	"32",
	["15", "[ 4 10 18]", "21"],
	"The dot product multiplies matching entries and adds them: 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32. The list [4 10 18] would be the elementwise product.",
	String.raw`import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(a @ b)`);
m.add('basic', 'cosine', "Two embedding vectors point in almost the same direction. What is their cosine similarity close to?",
	"Close to 1",
	["Close to 0", "Close to -1", "Close to the number of dimensions"],
	"Cosine similarity measures the angle between vectors: 1 for the same direction, 0 for perpendicular, -1 for opposite. It is bounded and does not grow with the number of dimensions.");
m.add('mid', 'gradient', "What does the gradient of the loss tell you about a weight?",
	"Which way to change it to increase the loss fastest",
	["The final accuracy the model will reach once training has finished", "How many training examples are still wrong", "The learning rate to use on the next step"],
	"The gradient is the slope of the loss for each weight. Gradient descent moves each weight in the opposite direction. The learning rate is a separate setting that you choose.");
m.add('mid', 'chain', "Backpropagation mostly applies which rule from calculus, layer by layer?",
	"The chain rule",
	["The product rule on the last layer only", "The power rule applied to every weight", "L'Hopital's rule for limits"],
	"A network is nested functions, and the chain rule multiplies local derivatives from the output back to each layer. That is how all gradients are computed in one backward pass.");
m.add('mid', 'softmax', "What does this print?",
	"[0.33 0.33 0.33]",
	["[2.72 2.72 2.72] (the raw exp values)", "[0.5 0.5 0.5]", "[0.  0.  1. ]"],
	"Equal scores give equal exp values, and softmax divides each by their sum, so each of the three gets one third. The probabilities sum to 1.",
	String.raw`import numpy as np

x = np.array([1.0, 1.0, 1.0])
e = np.exp(x)
p = e / e.sum()
print(p.round(2))`);
m.add('mid', 'cross-entropy', "A classifier gives the true class probability 0.9 on one example and 0.1 on another. Which example has the lower cross-entropy loss?",
	"The 0.9 example, since loss is minus log of the true-class probability",
	["The 0.1 example, since smaller probabilities always mean a smaller loss value", "Both are equal because the probabilities sum to one", "Neither, because cross-entropy ignores the true class"],
	"-log(0.9) is about 0.11 while -log(0.1) is about 2.3, so confident correct predictions get a small loss and confident wrong ones a large loss. The true class matters because its probability is the one used.");

const s = t('pa-sklearn', 'S');
s.add('basic', 'api', "In scikit-learn, what is the difference between fit and transform on a scaler?",
	"fit learns the statistics from data, transform applies them",
	["fit applies the scaling and transform learns the statistics", "fit trains on the labels and transform predicts them", "They do the same thing, but transform runs faster on large inputs"],
	"For a StandardScaler, fit computes the mean and standard deviation and transform uses them. fit_transform does both in one call, and you should only fit on training data.");
s.add('basic', 'split', "Why hold out a test set?",
	"To estimate performance on data the model never saw in training",
	["To give the model more rows to learn from", "To make training finish in less time", "To remove outliers and noisy rows from the training data before fitting"],
	"A model scores well on rows it has memorised, so you need fresh rows for an honest estimate. A hold-out set reduces the training data and does not speed up training or clean outliers.");
s.add('basic', 'metric', "Which metric is the most misleading when 98 percent of rows belong to one class?",
	"Accuracy",
	["Precision on the rare class", "Recall on the rare class", "F1 score on the rare class"],
	"Predicting the majority class every time gives 98 percent accuracy while finding nothing. Precision, recall and F1 on the rare class all expose that failure.");
s.add('mid', 'leakage', "Which of these is data leakage?",
	"Fitting a scaler on all the data before splitting into train and test",
	["Using a different random seed for the train-test split on every run of the script", "Dropping rows with missing labels before training", "Evaluating on a test set that is 20 percent of the data"],
	"The scaler's mean and spread would include test rows, so information from test reaches training. The other choices do not move test information into training.");
s.add('mid', 'cv', "What is the main benefit of 5-fold cross-validation over a single split?",
	"Every row is used for validation once, giving a steadier estimate",
	["It trains one model that is five times larger", "It guarantees that the final model will never overfit on any future data", "It makes each training run five times faster"],
	"Averaging five scores reduces the luck of one particular split and shows the spread. It costs about five times the training work and does not prevent overfitting.");
s.add('mid', 'overfit', "Training accuracy is 99 percent and validation accuracy is 70 percent. What is the most likely problem?",
	"Overfitting",
	["Underfitting", "A perfectly balanced dataset", "A learning rate that is exactly right"],
	"A large gap between training and validation scores means the model memorised the training data. Underfitting would show poor scores on both.");
s.add('mid', 'pipeline', "A fitted Pipeline of StandardScaler then LogisticRegression is used with predict(X_new). What happens to X_new?",
	"It is scaled with the training mean and spread, then classified",
	["It is scaled with its own mean and spread, then passed to the classifier", "It goes straight to the classifier without scaling", "The scaler is refitted on X_new first"],
	"The pipeline reuses the statistics learned during fit and calls transform only. Refitting on new data would make predictions depend on whichever batch arrived.",
	String.raw`model = make_pipeline(StandardScaler(), LogisticRegression())
model.fit(X_train, y_train)
model.predict(X_new)`);
s.add('advanced', 'boosting', "On a typical table with mixed numeric and categorical columns and about 50 thousand rows, what is usually a strong first model?",
	"Gradient-boosted trees such as LightGBM or XGBoost",
	["A large transformer language model trained from scratch on the table", "A deep convolutional network", "k-means clustering on the target column"],
	"Boosted trees handle mixed features, missing values and non-linear effects with little tuning and often beat neural networks on tabular data. The others need far more data or solve different problems.");
s.add('advanced', 'roc-auc', "What does ROC-AUC measure?",
	"How well scores rank positives above negatives across all thresholds",
	["The accuracy at the single threshold 0.5", "The share of all positives that the model finds at one chosen decision threshold", "The average squared gap between scores and labels"],
	"AUC is the probability that a random positive gets a higher score than a random negative, so it is threshold-free. The other options describe accuracy, recall, and a squared-error score.");
s.add('advanced', 'regression', "Which regression metric punishes large errors more heavily?",
	"RMSE, because errors are squared before averaging",
	["MAE, because it adds up the raw errors without any weighting at all", "Neither, because they are always equal", "MAE, since it takes absolute values"],
	"Squaring makes one error of 10 count as much as 100 errors of 1 in the sum of squares, so RMSE is more sensitive to outliers. MAE treats every unit of error equally.");

const d = t('pa-data-viz-eda', 'D');
d.add('basic', 'imbalance', "A fraud dataset has 0.5 percent positive rows. What is a good first step?",
	"Check class balance and choose metrics like recall and PR-AUC",
	["Delete majority rows until both classes are equal", "Report accuracy only, since it is the standard metric for classification", "Shuffle the labels to remove any bias"],
	"Counting the classes tells you accuracy is meaningless here. Precision, recall and PR-AUC suit rare positives, and blindly deleting rows throws away information.");
d.add('basic', 'plot', "Which plot is the best first look at one numeric column?",
	"A histogram",
	["A pie chart of its values", "A line chart of its row number", "A scatter plot against the index only"],
	"A histogram shows the distribution: its centre, spread, skew and outliers. The other charts hide those or only show order.");
d.add('mid', 'time-split', "You forecast next month's demand from past data. How should you split train and test?",
	"By time: train on the past, test on later periods",
	["Shuffle all rows randomly, which is always the safest", "By the alphabetical order of product names", "Test on the oldest data and train on the newest"],
	"A forecast is always about the future, so the test period must come after the training period. Random shuffling lets the model peek at the future and inflates scores.");
d.add('mid', 'stratify', "What does stratify=y do in train_test_split?",
	"Keeps the class proportions the same in both splits",
	["Sorts the rows by label before splitting them into two parts", "Removes duplicate rows from the data", "Balances the classes by oversampling"],
	"Stratified splitting preserves class ratios, which matters for imbalanced data so the test set still has rare positives. It does not sort, deduplicate or resample.");
d.add('advanced', 'eda-leak', "Where should EDA that influences your feature choices be done?",
	"On the training split only, leaving the test set untouched",
	["On the full dataset, since more rows reveal more of the useful patterns", "On the test set, to confirm it looks like training", "On a random sample of the test set"],
	"Decisions informed by test rows quietly leak test information into the model. Explore the training data, and use the test set once at the end.");

export const banks: { out: Question[] }[] = [r, e, n, p, m, s, d];
