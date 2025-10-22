import { describe, it, expect } from 'vitest';
import { hardenJs, jsFrozenBuiltins, removeJs } from '../src/targets/javascript';

describe('javascript target (direct)', () => {
	// NOTE: these tests intentionally call hardenJs() in-process (no VM) and therefore
	// permanently freeze the real globals in the test process. This is what you asked
	// for: run the hardener ASAP and then attempt strict-mode modifications and assert
	// the caught errors. Be aware this mutates the runtime for the remainder of the run.

	function tryModifyBuiltinAssignment (builtinName: string): any {
		// Attempt an assignment to the named global in strict mode inside a function.
		// If the object is frozen/non-extensible the assignment will throw a TypeError.
		let caught: any = null;
		try {
			(function () {
				'use strict';
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore - intentionally referencing globals by name
				(globalThis as any)[builtinName].INJECTED_TEST_PROP = 12345;
			})();
		} catch (e) {
			caught = e;
		}
		return caught;
	}

	it('hardenJs sets __BUILTINS_FROZEN__ marker', () => {
		hardenJs();
		expect((globalThis as any).__BUILTINS_FROZEN__).toBe(true);
	});

	it('assignment to frozen Object throws in strict mode', () => {
		hardenJs();
		const err = tryModifyBuiltinAssignment('Object');
		expect(err).toBeTruthy();
		expect(err).toBeInstanceOf(TypeError);
	});

	// run a representative subset and then the full list; each test calls hardenJs()
	for (const name of jsFrozenBuiltins) {
		it(`strict-mode assignment to ${name} is caught`, () => {
			hardenJs();
			const err = tryModifyBuiltinAssignment(name);
			// For some builtins the runtime may not allow assignment at all or may not
			// be present; assert that either a TypeError was thrown or the property
			// was not created.
			if (err) {
				expect(err).toBeInstanceOf(TypeError);
			} else {
				// no error thrown — ensure the property isn't present on the builtin
				// (this covers environments where the builtin isn't freezable)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const has = Object.prototype.hasOwnProperty.call((globalThis as any)[name] || {}, 'INJECTED_TEST_PROP');
				expect(has).toBe(false);
			}
		});
	}

	describe('removeJs helper', () => {
		it('removes a top-level property from globalThis', () => {
			// create a test property
			(globalThis as any).TEMP_REMOVE_ME = { a: 1 };
			const report = removeJs(['TEMP_REMOVE_ME']);
			expect(report.removed).toContain('TEMP_REMOVE_ME');
			expect(Object.prototype.hasOwnProperty.call(globalThis, 'TEMP_REMOVE_ME')).toBe(false);
		});

		it('removes nested property by dotted path', () => {
			// create nested namespace
			(globalThis as any).NS = { inner: { value: 10 } };
			const report = removeJs(['NS.inner.value']);
			expect(report.removed).toContain('NS.inner.value');
			// after removing the property it should not be present on NS.inner
			const has = Object.prototype.hasOwnProperty.call((globalThis as any).NS.inner || {}, 'value');
			expect(has).toBe(false);
		});

		it('reports missing paths without throwing', () => {
			const report = removeJs(['I_DO_NOT_EXIST']);
			expect(report.removed).not.toContain('I_DO_NOT_EXIST');
			expect(report.failures.length).toBeGreaterThanOrEqual(1);
			expect(report.failures[0].path).toBe('I_DO_NOT_EXIST');
		});

		it('reports non-configurable property removal as failure', () => {
			Object.defineProperty(globalThis, 'NC_PROP', { value: 2, configurable: false, writable: true });
			try {
				const report = removeJs(['NC_PROP']);
				// should not be removed
				expect(report.removed).not.toContain('NC_PROP');
				const f = report.failures.find(x => x.path === 'NC_PROP');
				expect(f).toBeTruthy();
			} finally {
				// cleanup: if possible, set writable to false (can't delete non-configurable), leave as-is
				try { (globalThis as any).NC_PROP = 2; } catch (e) { /* ignore */ }
			}
		});
	});
});
