import { isObjectLike, freezeDeep } from '../utils';
import { removeFromRoot } from '../utils/remove';

export const nodeFrozenBuiltins = [
	// ECMAScript builtins
	'Object', 'Function', 'Boolean', 'Symbol', 'Error', 'RangeError', 'ReferenceError',
	'SyntaxError', 'TypeError', 'URIError', 'Number', 'BigInt', 'Math', 'Date', 'String',
	'RegExp', 'Array', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Reflect', 'JSON', 'Intl',
	// Typed arrays
	'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray',
	'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array',
	'BigInt64Array', 'BigUint64Array',
	// Node & environment globals
	'global', // will map to global object
	'Buffer', 'console', 'process', 'require', 'module', 'exports',
	'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate',
	// URL / networking
	'URL', 'URLSearchParams'
];

let _hardened = false;

type HardenOpts = { skip?: string[]; ignoreReadonlyConstructorError?: boolean } | undefined;

function setupIgnoreConstructorHandler (auditFailures: Array<{ path: string; err: string }>): ((err: unknown) => void) | undefined {
	if (typeof process === 'undefined' || typeof (process as any).on !== 'function') { return undefined; }
	const handler = (err: unknown): void => {
		try {
			const msg = err && (err as any).message ? (err as any).message : String(err);
			if (typeof msg === 'string' && msg.includes("Cannot assign to read only property 'constructor'")) {
				auditFailures.push({ path: '<internal>', err: msg });
				return;
			}
		} catch (_e) {
			// fall through and rethrow below
		}
		if (err instanceof Error) { throw err; }
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

function freezeBuiltin (globals: any, name: string, seen: WeakSet<any>, auditFailures: Array<{ path: string; err: string }>): void {
	try {
		let target: any;
		if (name === 'global') { target = globals; } else { target = globals[name]; }
		if (!isObjectLike(target)) { return; }
		freezeDeep(target, name, seen as any, auditFailures, { skipKeys: ['constructor'] });
		if (isObjectLike((target as any).prototype)) {
			freezeDeep((target as any).prototype, name + '.prototype', seen as any, auditFailures, { skipKeys: ['constructor'] });
		}
	} catch (e) {
		auditFailures.push({ path: name, err: e && (e as Error).message ? (e as Error).message : String(e) });
	}
}

export function hardenNode (opts?: HardenOpts): void {
	if (_hardened) { return; }
	_hardened = true;

	const G: any = typeof global !== 'undefined' ? global : (globalThis as any);
	const seen = new WeakSet<any>();
	const auditFailures: Array<{ path: string; err: string }> = [];

	const skipSet = new Set<string>((opts && opts.skip) || []);
	const handler = opts && opts.ignoreReadonlyConstructorError ? setupIgnoreConstructorHandler(auditFailures) : undefined;

	for (const name of nodeFrozenBuiltins) {
		if (skipSet.has(name)) { continue; }
		freezeBuiltin(G, name, seen, auditFailures);
	}

	// Mark that we've run
	try {
		Object.defineProperty(G, '__NODE_BUILTINS_FROZEN__', { value: true, configurable: false, writable: false });
	} catch (e) {
		auditFailures.push({ path: '__NODE_BUILTINS_FROZEN__', err: e && (e as Error).message ? (e as Error).message : String(e) });
	}

	function logAuditFailures (): void {
		try {
			if (auditFailures.length && typeof console !== 'undefined' && (console as any).warn) {
				(console as any).warn('freeze-node-builtins: audit failures (first 50):', auditFailures.slice(0, 50));
			}
		} catch (e) { /* ignore logging errors */ }
	}

	logAuditFailures();

	// clean up temporary handler
	removeIgnoreConstructorHandler(handler);
}

export function removeNode (paths?: string[]): import('../utils/remove').RemoveReport {
	const G: any = typeof global !== 'undefined' ? global : (globalThis as any);
	return removeFromRoot(G, paths);
}
