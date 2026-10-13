// 4. Event loop ordering. Return the array of labels in the order they log.
// Don't run it first — predict, then run `bun run test` to check yourself.
export async function eventLoopOrder(): Promise<string[]> {
	const log: string[] = [];
	// Fill in: reproduce the output order of this snippet using real scheduling:
	//   setTimeout(() => log('timeout'), 0)
	//   Promise.resolve().then(() => log('micro1'))
	//   queueMicrotask(() => log('micro2'))
	//   log('sync')
	//   (async () => { log('async-start'); await null; log('async-after-await') })()
	// Then return log after everything has flushed.
	throw new Error('TODO');
}
