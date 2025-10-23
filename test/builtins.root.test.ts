import { describe, it, expect } from 'vitest';
import { isValidRoot, nodeFrozenBuiltins, jsFrozenBuiltins, browserFrozenBuiltins } from '../src/targets/builtins';

describe('builtins root validation', () => {
	it('accepts known node builtins', () => {
		for (const name of nodeFrozenBuiltins as readonly string[]) {
			expect(isValidRoot(name)).toBe(true);
			// lowercased variant
			expect(isValidRoot(name.toLowerCase())).toBe(true);
			// dotted path starting with builtin
			expect(isValidRoot(name + '.something')).toBe(true);
		}
	});

	it('accepts known js builtins', () => {
		for (const name of jsFrozenBuiltins as readonly string[]) {
			expect(isValidRoot(name)).toBe(true);
			expect(isValidRoot(name.toLowerCase())).toBe(true);
			expect(isValidRoot(name + '.x')).toBe(true);
		}
	});

	it('accepts known browser builtins', () => {
		for (const name of browserFrozenBuiltins as readonly string[]) {
			expect(isValidRoot(name)).toBe(true);
			expect(isValidRoot(name.toLowerCase())).toBe(true);
			expect(isValidRoot(name + '.prototype')).toBe(true);
		}
	});

	it('rejects unknown roots', () => {
		expect(isValidRoot('NotABuiltin')).toBe(false);
		expect(isValidRoot('someRandom.root')).toBe(false);
		expect(isValidRoot('')).toBe(false);
	});
});
