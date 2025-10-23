import { isObjectLike } from '../utils';
import { isValidRoot } from './builtins';

type RemoveReport = {
  removed: string[];
  failures: Array<{ path: string; err: string }>;
};

function resolveContainer (root: any, segments: string[]): { container: any; prop: string } | null {
	try {
		let cur = root;
		for (let i = 0; i + 1 < segments.length; i++) {
			const seg = segments[i];
			if (!isObjectLike(cur)) {
				return null;
			}
			cur = (cur as any)[seg];
			if (cur === undefined || cur === null) {
				return null;
			}
		}
		const prop = segments[segments.length - 1];
		return { container: cur, prop };
	} catch (e) {
		return null;
	}
}

function tryRemoveFrom (root: any, path: string): { ok: boolean; err?: string } {
	const segments = path.split('.').filter(Boolean);
	if (segments.length === 0) {
		return { ok: false, err: 'empty path' };
	}
	// Validate that the top-level root segment is a known builtin/root
	const top = segments[0];
	if (!isValidRoot(top)) {
		return { ok: false, err: 'invalid root' };
	}
	function attemptRemoveProperty (target: any, name: string): { ok: boolean; err?: string } {
		try {
			const tgt = target as any;
			try {
				// try delete first
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				const deleted = delete tgt[name];
				if (deleted) {
					return { ok: true };
				}
			} catch (e) {
				// ignore delete error
			}
			try {
				const desc = Object.getOwnPropertyDescriptor(tgt, name as any) as PropertyDescriptor | undefined;
				if (!desc || desc.configurable === true) {
					try {
						tgt[name] = undefined;
						return { ok: true };
					} catch (e) {
						return { ok: false, err: String(e) };
					}
				}
				return { ok: false, err: 'property not configurable' };
			} catch (e) {
				return { ok: false, err: String(e) };
			}
		} catch (e) {
			return { ok: false, err: String(e) };
		}
	}
	// direct top-level like 'Object'
	if (segments.length === 1) {
		const name = segments[0];
		try {
			if (name in root) {
				return attemptRemoveProperty(root, name);
			}
			return { ok: false, err: 'not present' };
		} catch (e) {
			return { ok: false, err: String(e) };
		}
	}

	const resolved = resolveContainer(root, segments);
	if (!resolved) {
		return { ok: false, err: 'parent path not found' };
	}
	const { container, prop } = resolved;
	if (!isObjectLike(container)) {
		return { ok: false, err: 'container not object-like' };
	}
	try {
		if (Object.prototype.hasOwnProperty.call(container, prop)) {
			return attemptRemoveProperty(container, prop);
		}
		return { ok: false, err: 'property not present' };
	} catch (e) {
		return { ok: false, err: String(e) };
	}
}

function removeFromRoot (root: any, paths: string[] | undefined): RemoveReport {
	const removed: string[] = [];
	const failures: Array<{ path: string; err: string }> = [];
	if (!paths || paths.length === 0) {
		return { removed, failures };
	}
	for (const p of paths) {
		try {
			const r = tryRemoveFrom(root, p);
			if (r.ok) {
				removed.push(p);
			} else {
				failures.push({ path: p, err: r.err || 'unknown' });
			}
		} catch (e) {
			failures.push({ path: p, err: e && (e as Error).message ? (e as Error).message : String(e) });
		}
	}
	return { removed, failures };
}

export function removeJs (paths?: string[]): RemoveReport {
	const G: any = typeof globalThis !== 'undefined' ? globalThis : (window as any);
	return removeFromRoot(G, paths);
}

export function removeNode (paths?: string[]): RemoveReport {
	const G: any = typeof global !== 'undefined' ? global : (globalThis as any);
	return removeFromRoot(G, paths);
}

export function removeBrowser (paths?: string[]): RemoveReport {
	const G: any = typeof window !== 'undefined' ? window : (globalThis as any);
	return removeFromRoot(G, paths);
}
