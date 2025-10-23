import { isObjectLike } from './object';
import { freezeDeep } from './freeze';

export function setupIgnoreConstructorHandler (auditFailures?: Array<{ path: string; err: string }>): ((err: unknown) => void) | undefined {
	if (typeof process === 'undefined' || typeof (process as any).on !== 'function') { return undefined; }
	const handler = (err: unknown): void => {
		try {
			const msg = err && (err as any).message ? (err as any).message : String(err);
			if (typeof msg === 'string' && msg.includes("Cannot assign to read only property 'constructor'")) {
				if (auditFailures) { auditFailures.push({ path: '<internal>', err: msg }); }
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

export function removeIgnoreConstructorHandler (handler?: (err: unknown) => void): void {
	if (!handler || typeof process === 'undefined' || typeof (process as any).removeListener !== 'function') { return; }
	try { (process as any).removeListener('uncaughtException', handler); } catch (e) { /* ignore */ }
}

export function freezeBuiltin (globals: any, name: string, seen?: WeakSet<any>, auditFailures?: Array<{ path: string; err: string }>): void {
	try {
		let target: any;
		if (name === 'global') { target = globals; } else { target = globals[name]; }
		if (!isObjectLike(target)) { return; }
		freezeDeep(target, name, seen as any, auditFailures, { skipKeys: ['constructor'] });
		if (isObjectLike((target as any).prototype)) {
			freezeDeep((target as any).prototype, name + '.prototype', seen as any, auditFailures, { skipKeys: ['constructor'] });
		}
	} catch (e) {
		if (auditFailures) { auditFailures.push({ path: name, err: e && (e as Error).message ? (e as Error).message : String(e) }); }
	}
}
