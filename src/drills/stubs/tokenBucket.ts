// Interview · SDE 2: token-bucket rate limiter with lazy refill (no timers). `now` is injectable.
export class TokenBucket {
	constructor(private capacity: number, private refillPerSec: number, private now: () => number = Date.now) {}
	tryTake(n = 1): boolean {
		throw new Error('TODO');
	}
}
