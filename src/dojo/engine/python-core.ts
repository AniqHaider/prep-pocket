// Runs a learner's Python against an exercise's tests inside Pyodide.
// Pure logic shared by the web worker and the Node verification script.
// Port of backend/app/runner/python_runner.py (subprocess -> in-browser Pyodide).

export interface PyTest { call: string; expect: unknown }
export interface PyTestResult { call: string; passed: boolean; expected: string; got: string | null; error?: string }
export interface PyResult {
	all_passed: boolean;
	results: PyTestResult[];
	error_category: string | null;
	detail: string | null;
}

// The harness uses top-level await so async exercises (coroutines) work without asyncio.run,
// which cannot be used inside Pyodide's already-running event loop.
const HARNESS = `
import json as _dojo_json
import inspect as _dojo_inspect
_dojo_results = []
for _t in _dojo_json.loads(__dojo_tests_json):
    try:
        _got = eval(_t["call"])
        if _dojo_inspect.iscoroutine(_got):
            _got = await _got
        _dojo_results.append({
            "call": _t["call"],
            "passed": _got == _t["expect"],
            "expected": repr(_t["expect"]),
            "got": repr(_got),
        })
    except Exception as _e:
        _dojo_results.append({
            "call": _t["call"],
            "passed": False,
            "expected": repr(_t["expect"]),
            "got": None,
            "error": "{}: {}".format(type(_e).__name__, _e),
        })
_dojo_json.dumps(_dojo_results)
`;

// Pyodide's CPython is built without OpenSSL, so hashlib.pbkdf2_hmac is missing. This RFC 8018 shim runs
// on the C-level hmac.digest (100k iterations ~0.2s) and is verified against the RFC 6070 vectors.
const PRELUDE = `
import hashlib as _h, hmac as _hm, struct as _st
if not hasattr(_h, "pbkdf2_hmac"):
    def _pbkdf2_hmac(hash_name, password, salt, iterations, dklen=None):
        if iterations < 1:
            raise ValueError("iteration value must be greater than 0.")
        dig = _h.new(hash_name).digest_size
        dklen = dklen or dig
        if dklen < 1:
            raise ValueError("key length must be greater than 0.")
        out = b""
        for block in range(1, -(-dklen // dig) + 1):
            u = _hm.digest(password, salt + _st.pack(">I", block), hash_name)
            acc = int.from_bytes(u, "big")
            for _ in range(iterations - 1):
                u = _hm.digest(password, u, hash_name)
                acc ^= int.from_bytes(u, "big")
            out += acc.to_bytes(dig, "big")
        return out[:dklen]
    _h.pbkdf2_hmac = _pbkdf2_hmac
`;

/** Call once per Pyodide instance, before running any exercise. */
export async function initPython(py: Pyodide): Promise<void> {
	await py.runPythonAsync(PRELUDE, { globals: py.globals.get('dict')() });
}

// Minimal structural type for the parts of Pyodide we use (keeps this file import-free).
interface Pyodide {
	globals: { get(name: string): any };
	runPythonAsync(code: string, opts?: { globals?: any }): Promise<any>;
}

export async function runPython(py: Pyodide, code: string, tests: PyTest[]): Promise<PyResult> {
	const ns = py.globals.get('dict')();
	try {
		try {
			await py.runPythonAsync(code, { globals: ns });
		} catch (e: any) {
			const msg = String(e?.message ?? e);
			return {
				all_passed: false,
				results: [],
				error_category: msg.includes('SyntaxError') ? 'syntax_error' : 'runtime_error',
				detail: msg.trim().slice(-1000)
			};
		}
		ns.set('__dojo_tests_json', JSON.stringify(tests));
		let results: PyTestResult[];
		try {
			results = JSON.parse(await py.runPythonAsync(HARNESS, { globals: ns }));
		} catch (e: any) {
			return { all_passed: false, results: [], error_category: 'runtime_error', detail: String(e?.message ?? e).trim().slice(-1000) };
		}
		const all = results.every((r) => r.passed);
		if (all) return { all_passed: true, results, error_category: null, detail: null };
		const errored = results.find((r) => r.error);
		if (errored) return { all_passed: false, results, error_category: 'runtime_error', detail: errored.error! };
		const first = results.find((r) => !r.passed)!;
		return { all_passed: false, results, error_category: 'wrong_output', detail: `${first.call} -> expected ${first.expected}, got ${first.got}` };
	} finally {
		ns.destroy?.();
	}
}
