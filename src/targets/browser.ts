import { setupIgnoreConstructorHandler, removeIgnoreConstructorHandler, freezeBuiltin } from '../utils';
import { removeFromRoot } from '../utils/remove';
import { browserFrozenBuiltins } from './builtins';
export { browserFrozenBuiltins };

let _hardened = false;

type HardenOpts = { ignoreReadonlyConstructorError?: boolean } | undefined;

export function hardenBrowser (opts?: HardenOpts): void {
	if (_hardened) { return; }
	_hardened = true;

	const GLOBAL: any = typeof window !== 'undefined' ? window : (globalThis as any);
	const handler = opts && opts.ignoreReadonlyConstructorError ? setupIgnoreConstructorHandler() : undefined;

	const seen = new WeakSet<any>();
	for (const name of browserFrozenBuiltins) {
		freezeBuiltin(GLOBAL, name, seen);
	}

	// Extra: freeze common prototypes when document exists
	function freezeCommonPrototypes (): void {
		try {
			if (!GLOBAL.document) { return; }
			if ((Document as any) && (Document as any).prototype) { freezeBuiltin(GLOBAL, 'Document', seen); }
			if ((Element as any) && (Element as any).prototype) { freezeBuiltin(GLOBAL, 'Element', seen); }
		} catch (e) { /* ignore */ }
	}
	freezeCommonPrototypes();

	try { Object.defineProperty(GLOBAL, '__WEBAPI_FROZEN__', { value: true, configurable: false, writable: false }); } catch (e) { /* ignore */ }

	// clean up temporary handler
	removeIgnoreConstructorHandler(handler);
}

export function removeBrowser (paths?: string[]): import('../utils/remove').RemoveReport {
	const G: any = typeof window !== 'undefined' ? window : (globalThis as any);
	return removeFromRoot(G, paths);
}
