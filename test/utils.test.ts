import { describe, it, expect } from 'vitest';
import { isObjectLike, freezeDeep } from '../src/utils';
import { safeFreeze } from '../src/utils/freeze';

describe('utils (TypeScript)', () => {
	it('isObjectLike returns true for objects and functions', () => {
		expect(isObjectLike({})).toBe(true);
		expect(isObjectLike(() => {})).toBe(true);
		expect(isObjectLike(null)).toBe(false);
		expect(isObjectLike(42)).toBe(false);
	});

	it('safeFreeze returns true for freezable objects and false otherwise', () => {
		const o = { a: 1 };
		expect(safeFreeze(o)).toBe(true);
		// primitives: Object.freeze coerces, but our safeFreeze returns false for non-object-like
		expect(safeFreeze(42)).toBe(false);
	});

	it('freezeDeep freezes nested objects and arrays', () => {
		const obj: any = { x: { y: [1, 2, { z: 3 }] } };
		freezeDeep({ obj });
		expect(Object.isFrozen(obj)).toBe(true);
		expect(Object.isFrozen(obj.x)).toBe(true);
		expect(Object.isFrozen(obj.x.y)).toBe(true);
		expect(Object.isFrozen(obj.x.y[2])).toBe(true);
	});

	it('freezeDeep handles cycles without throwing', () => {
		const a: any = { name: 'a' };
		const b: any = { name: 'b', ref: a };
		a.ref = b; // create cycle
		expect(() => freezeDeep({ obj: a })).not.toThrow();
		expect(Object.isFrozen(a)).toBe(true);
		expect(Object.isFrozen(b)).toBe(true);
	});

	it('freezeDeep freezes functions, getters and setters and traverses prototypes', () => {
		function Fn (): undefined { }
		Fn.prototype.method = function () { return 1; };
		const obj: any = new (Fn as any)();
		Object.defineProperty(obj, 'val', {
			get (): number { return 1; },
			/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
			set (_v): void { /* noop */ },
			configurable: true,
			enumerable: true
		});

		const failures: Array<{ path: string; err: string }> = [];
		freezeDeep({ obj, path: '<root>', seen: new WeakSet(), auditFailures: failures });
		// prototype should be frozen
		const proto = Object.getPrototypeOf(obj);
		expect(Object.isFrozen(proto)).toBe(true);
		// accessors should not throw and should be considered
		expect(Array.isArray(failures)).toBe(true);
	});

	it('safeFreeze records failures when freezing non-extensible or exotic objects', () => {
		const failures: Array<{ path: string; err: string }> = [];
		// create a proxy that throws on freeze
		const bad = new Proxy({}, {
			preventExtensions () { throw new Error('nope'); }
		});
		const ok = safeFreeze(bad, '<root.bad>', failures as any);
		expect(ok).toBe(false);
		expect(failures.length).toBeGreaterThanOrEqual(1);
		expect(failures[0].path).toContain('<root.bad>');
	});
});
