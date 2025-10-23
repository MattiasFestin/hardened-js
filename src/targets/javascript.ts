import { isObjectLike, freezeDeep } from '../utils';
import { removeFromRoot } from '../utils/remove';

// List of common built-in constructors/namespaces to freeze
export const jsFrozenBuiltins = [
	'Object', 'Function', 'Boolean', 'Symbol', 'Error', 'EvalError', 'RangeError', 'ReferenceError',
	'SyntaxError', 'TypeError', 'URIError', 'Number', 'BigInt', 'Math', 'Date', 'String', 'RegExp',
	'Array', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
	'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
	'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy', 'Reflect', 'JSON'
];

let _hardened = false;

type HardenOpts = { ignoreReadonlyConstructorError?: boolean } | undefined;

function setupIgnoreConstructorHandler (): ((err: unknown) => void) | undefined {
	if (typeof process === 'undefined' || typeof (process as any).on !== 'function') { return undefined; }
	const handler = (err: unknown): void => {
		try {
			const msg = err && (err as any).message ? (err as any).message : String(err);
			if (typeof msg === 'string' && msg.includes("Cannot assign to read only property 'constructor'")) {
				return;
			}
		} catch (_e) {
			// fall through and rethrow below
		}
		// rethrow so other handlers or the process behave normally
		if (err instanceof Error) {
			throw err;
		}
		throw new Error(String(err));
	};
	try {
		(process as any).on('uncaughtException', handler);
		return handler;
	} catch (e) {
		return undefined;
	}
}

function removeIgnoreConstructorHandler (handler?: (err: unknown) => void): void {
	if (!handler || typeof process === 'undefined' || typeof (process as any).removeListener !== 'function') { return; }
	try { (process as any).removeListener('uncaughtException', handler); } catch (e) { /* ignore */ }
}

function freezeBuiltin (globals: any, name: string): void {
	try {
		const target = globals[name];
		if (!isObjectLike(target)) { return; }
		freezeDeep(target, name, undefined, undefined, { skipKeys: ['constructor'] });
		if (isObjectLike((target as any).prototype)) {
			freezeDeep((target as any).prototype, name + '.prototype', undefined, undefined, { skipKeys: ['constructor'] });
		}
	} catch (e) {
		// ignore failures for individual builtins
	}
}

export function hardenJs (opts?: HardenOpts): void {
	if (_hardened) { return; }
	_hardened = true;

	const globals: any = typeof window !== 'undefined' ? window : (globalThis as any);

	const handler = opts && opts.ignoreReadonlyConstructorError ? setupIgnoreConstructorHandler() : undefined;

	for (const name of jsFrozenBuiltins) {
		freezeBuiltin(globals, name);
	}

	// Mark that we've run (can be used as a checkpoint)
	try { Object.defineProperty(globals, '__BUILTINS_FROZEN__', { value: true, configurable: false, writable: false }); } catch (e) { /* ignore */ }

	// clean up temporary handler
	removeIgnoreConstructorHandler(handler);
}

export function removeJs (paths?: string[]): import('../utils/remove').RemoveReport {
	const G: any = typeof globalThis !== 'undefined' ? globalThis : (window as any);
	return removeFromRoot(G, paths);
}
