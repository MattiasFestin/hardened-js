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

export let hardenBrowser: (opts?: { ignoreReadonlyConstructorError?: boolean }) => void = function _hardenBrowser (opts?: { ignoreReadonlyConstructorError?: boolean }): void {
	'use strict';
	const GLOBAL: any = typeof window !== 'undefined' ? window : (globalThis as any);
	const ignoreCtorErr = !!(opts && opts.ignoreReadonlyConstructorError);
	let _origUncaught: any;
	if (ignoreCtorErr && typeof process !== 'undefined' && (process as any).on) {
		_origUncaught = (process as any)._events && (process as any)._events.uncaughtException;
		(process as any).on('uncaughtException', function _hardenIgnore (err: any) {
			try {
				const msg = err && err.message ? err.message : String(err);
				if (msg && msg.includes("Cannot assign to read only property 'constructor'")) {
					return;
				}
			} catch (e) { }
			throw err;
		});
	}

	const seen = new WeakSet<any>();

	function freezeDeepLocal (obj: any): void {
		// Use the generic freezeDeep from utils but keep a local seen set to avoid cycles
		freezeDeep(obj, '<root>', seen as any, undefined, { skipKeys: ['constructor'] });
	}

	for (const name of browserFrozenBuiltins) {
		try {
			const target = GLOBAL[name];
			if (isObjectLike(target)) {
				freezeDeepLocal(target);
				if (target.prototype && isObjectLike(target.prototype)) {
					freezeDeepLocal(target.prototype);
				}
			}
		} catch (e) { }
	}

	// Extra: freeze document/documentElement if possible (may be dangerous)
	try {
		if (GLOBAL.document) {
			// Don't deep-freeze the document node: it may break the app.
			// Instead, freeze prototype objects like Document.prototype and Element.prototype.
			if ((Document as any) && (Document as any).prototype) { freezeDeepLocal((Document as any).prototype); }
			if ((Element as any) && (Element as any).prototype) { freezeDeepLocal((Element as any).prototype); }
		}
	} catch (e) { }

	try { Object.defineProperty(GLOBAL, '__WEBAPI_FROZEN__', { value: true, configurable: false, writable: false }); } catch (e) { }
	// Replace exported binding with a noop so subsequent calls are safe
	try { hardenBrowser = function () { /* noop - already hardened */ }; } catch (e) { /* ignore */ }
	if (ignoreCtorErr && typeof process !== 'undefined' && (process as any).removeListener) {
		try { (process as any).removeListener('uncaughtException', (process as any)._events && (process as any)._events.uncaughtException); } catch (e) { }
		try { if (_origUncaught) { (process as any).on('uncaughtException', _origUncaught); } } catch (e) { }
	}
};

export function removeBrowser (paths?: string[]): import('../utils/remove').RemoveReport {
	const G: any = typeof window !== 'undefined' ? window : (globalThis as any);
	return removeFromRoot(G, paths);
}
