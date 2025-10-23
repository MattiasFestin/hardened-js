import { removeFromRoot } from '../utils/remove';
import { nodeFrozenBuiltins } from './builtins';
import { setupIgnoreConstructorHandler, removeIgnoreConstructorHandler, freezeBuiltin } from '../utils';
export { nodeFrozenBuiltins };
let _hardened = false;

type HardenOpts = { skip?: string[]; ignoreReadonlyConstructorError?: boolean } | undefined;

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
