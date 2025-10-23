import { isObjectLike, freezeDeep } from '../utils';
import { removeFromRoot } from '../utils/remove';

export const browserFrozenBuiltins = [
	'Window', 'Document', 'HTMLDocument', 'Element', 'Node', 'NodeList', 'Event', 'EventTarget',
	'HTMLElement', 'HTMLDivElement', 'HTMLScriptElement', 'HTMLIFrameElement', 'MutationObserver',
	'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'TouchEvent', 'NodeIterator',
	'Range', 'Selection', 'FontFace', 'CSSStyleDeclaration',
	'XMLHttpRequest', 'FormData', 'URL', 'URLSearchParams', 'History', 'Location', 'Storage',
	'localStorage', 'sessionStorage', 'IndexedDB', 'Performance', 'navigator'
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

function freezeBuiltin (globals: any, name: string, seen: WeakSet<any>): void {
	try {
		const target = globals[name];
		if (!isObjectLike(target)) { return; }
		freezeDeep(target, name, seen as any, undefined, { skipKeys: ['constructor'] });
		if (isObjectLike((target as any).prototype)) {
			freezeDeep((target as any).prototype, name + '.prototype', seen as any, undefined, { skipKeys: ['constructor'] });
		}
	} catch (e) {
		// ignore failures for individual builtins
	}
}

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
