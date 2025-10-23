import { describe, it, expect } from 'vitest';
import { fnv1a32, combineHash, chainFromSeed } from '../src/integrity/hash';

describe('integrity/hash', () => {
	it('fnv1a32 produces stable, small-range integers', () => {
		const a = fnv1a32('hello');
		const b = fnv1a32('hello');
		const c = fnv1a32('world');

		expect(typeof a).toBe('number');
		expect(a).toBeGreaterThanOrEqual(0);
		expect(a).toBeLessThanOrEqual(0xFFFFFFFF);
		expect(a).toBe(b);
		expect(a).not.toBe(c);
	});

	it('combineHash mixes two values deterministically', () => {
		const h1 = fnv1a32('foo');
		const h2 = fnv1a32('bar');
		const combined1 = combineHash(h1, h2);
		const combined2 = combineHash(h1, h2);

		// determinism
		expect(combined1).toBe(combined2);
		// combining two different inputs should usually change the result
		expect(combined1).not.toBe(combineHash(h1, h1));
	});

	it('chainFromSeed returns a deterministic 32-bit number equal to combineHash', () => {
		const seed = 0x12345678;
		const merkle = 0xdeadbeef;
		const c1 = chainFromSeed(seed, merkle);
		const c2 = chainFromSeed(seed, merkle);

		expect(typeof c1).toBe('number');
		expect(c1).toBe(c2);
		expect(c1).toBe(combineHash(seed >>> 0, merkle >>> 0));
		// within 32-bit unsigned range
		expect(c1).toBeGreaterThanOrEqual(0);
		expect(c1).toBeLessThanOrEqual(0xFFFFFFFF);
	});
});
