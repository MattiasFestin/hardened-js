import { isObjectLike } from './object';

export function safeFreeze (obj: any, path?: string, auditFailures?: Array<{ path: string; err: string }>): boolean {
	try {
		if (!isObjectLike(obj)) {
			return false;
		}
		Object.freeze(obj);
		return true;
	} catch (e) {
		if (auditFailures) {
			auditFailures.push({ path: path || '<unknown>', err: e && (e as Error).message ? (e as Error).message : String(e) });
		}
		return false;
	}
}

export type FreezeOptions = { skipKeys?: Array<string | symbol> };

export function freezeDeep (obj: any, path = '<root>', seen = new WeakSet<any>(), auditFailures?: Array<{ path: string; err: string }>, options?: FreezeOptions): void {
	// Defensive wrapper: ensure freezeDeep never throws out of the function. Any
	// unexpected exception will be recorded in auditFailures (if provided) and
	// the traversal will stop for this branch. This prevents uncaught errors
	// from bubbling to test harnesses (which may attempt to serialize them and
	// fail with ERR_WORKER_UNSERIALIZABLE_ERROR).
	try {
		if (!isObjectLike(obj) || seen.has(obj)) { return; }
		seen.add(obj);

		try {
			safeFreeze(obj, path, auditFailures);
		} catch (e) { /* ignore */ }

		try {
			const proto = Object.getPrototypeOf(obj);
			if (proto && isObjectLike(proto)) { freezeDeep(proto, path + '.[[Prototype]]', seen, auditFailures); }
		} catch (e) { /* ignore */ }

		let names: string[] = [];
		try { names = Object.getOwnPropertyNames(obj); } catch (e) { names = []; }
		let symbols: (string | symbol)[] = [];
		try { symbols = Object.getOwnPropertySymbols(obj); } catch (e) { symbols = []; }

		const allKeys = names.concat(symbols as any) as Array<string | symbol>;
		for (const key of allKeys) {
			// honor skipKeys option from caller (used by tests to avoid freezing
			// problematic properties like 'constructor')
			try {
				if (options && options.skipKeys && options.skipKeys.indexOf(key) !== -1) { continue; }
			} catch (e) { /* ignore option errors */ }
			let desc: PropertyDescriptor | undefined;
			try { desc = Object.getOwnPropertyDescriptor(obj, key as any) as PropertyDescriptor | undefined; } catch (e) { continue; }
			if (!desc) { continue; }

			try {
				if ('value' in desc && isObjectLike(desc.value)) {
					freezeDeep(desc.value, path + '.' + String(key), seen, auditFailures);
				}
			} catch (e) { /* ignore freezing this value */ }

			try { if (desc.get && typeof desc.get === 'function') { freezeDeep(desc.get, path + '.<get ' + String(key) + '>', seen, auditFailures); } } catch (e) { /* ignore getter */ }
			try { if (desc.set && typeof desc.set === 'function') { freezeDeep(desc.set, path + '.<set ' + String(key) + '>', seen, auditFailures); } } catch (e) { /* ignore setter */ }
		}
	} catch (err) {
		try {
			if (auditFailures) { auditFailures.push({ path, err: err && (err as Error).message ? (err as Error).message : String(err) }); }
		} catch (e) { /* ignore audit push failures */ }
	}
}
