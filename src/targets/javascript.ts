import { setupIgnoreConstructorHandler, removeIgnoreConstructorHandler, freezeBuiltin, type GlobalLike } from '../utils';
import { removeFromRoot } from '../utils/remove';
import { jsFrozenBuiltins } from './builtins';

let _hardened = false;

type HardenOpts = { ignoreReadonlyConstructorError?: boolean } | undefined;

export function hardenJs (opts?: HardenOpts): void {
	if (_hardened) { return; }
	_hardened = true;

	const globals: GlobalLike = typeof window !== 'undefined' ? window as any : (globalThis as GlobalLike);

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
