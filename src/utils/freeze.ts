import { isObjectLike } from './object';

export function safeFreeze (obj: any, path?: string, auditFailures?: Array<{ path: string; err: string }>): boolean {
	try {
		if (!isObjectLike(obj)) {
			return false;
		}
		Object.freeze(obj);
		return true;
	} catch (err) {
		try {
			if (auditFailures) {
				auditFailures.push({ path: path || '<unknown>', err: err && (err as Error).message ? (err as Error).message : String(err) });
			}
		} catch (_) { /* ignore audit push failures */ }
		return false;
	}
}

type AuditFailures = Array<{ path: string; err: string }>;

export type FreezeOptions = { skipKeys?: Array<string | symbol> };

export type FreezeDeepArgs = {
	obj: any;
	path?: string;
	seen?: WeakSet<any>;
	auditFailures: AuditFailures;
	options?: FreezeOptions;
};

const safeCall = <T>(fn: () => T, auditFailures: AuditFailures, path: string, fallback?: T): T => {
	try {
		return fn();
	} catch (e) {
		try {
			if (auditFailures) {
				auditFailures.push({ path, err: e && (e as Error).message ? (e as Error).message : String(e) });
			}
		} catch (_) { /* ignore audit push failures */ }

		return fallback as any;
	}
};

export function freezeDeep (args: FreezeDeepArgs): void {
	const obj = args.obj;
	const path = args.path ?? '<root>';
	const seen = args.seen ?? new WeakSet<any>();
	const auditFailures = args.auditFailures;
	const options = args.options;

	if (!isObjectLike(obj) || seen.has(obj)) { return; }
	seen.add(obj);

	// safe freeze
	safeCall(
		() => { safeFreeze(obj, path, auditFailures); },
		auditFailures,
		path + '.[[Call]]'
	);

	// prototype
	const proto = safeCall(() => Object.getPrototypeOf(obj), undefined as any, path + '.[[Prototype]]');
	if (proto && isObjectLike(proto)) {
		freezeDeep({ obj: proto, path: path + '.[[Prototype]]', seen, auditFailures, options });
	}

	// keys
	const names: (string | symbol)[] = safeCall(() => Object.getOwnPropertyNames(obj), auditFailures, path + '.<names>', []);
	const symbols: (string | symbol)[] = safeCall(() => Object.getOwnPropertySymbols(obj), auditFailures, path + '.<symbols>', []);
	const allKeys = names.concat(symbols) as Array<string | symbol>;

	for (const key of allKeys) {
		const isSkippedKey = !!(options && options.skipKeys && options.skipKeys.indexOf(key) !== -1);
		if (isSkippedKey) { continue; }

		const desc = safeCall(() => Object.getOwnPropertyDescriptor(obj, key as any) as PropertyDescriptor | undefined, auditFailures, path + '.' + String(key));
		if (!desc) { continue; }

		// value
		safeCall(() => {
			if ('value' in desc && isObjectLike((desc as any).value)) {
				freezeDeep({ obj: (desc as any).value, path: path + '.' + String(key), seen, auditFailures, options });
			}
			return undefined;
		}, auditFailures, path + '.' + String(key));

		// getter
		safeCall(() => {
			if (desc.get && typeof desc.get === 'function') {
				freezeDeep({ obj: desc.get, path: path + '.<get ' + String(key) + '>', seen, auditFailures, options });
			}
			return undefined;
		}, auditFailures, path + '.<get ' + String(key) + '>');

		// setter
		safeCall(() => {
			if (desc.set && typeof desc.set === 'function') {
				freezeDeep({ obj: desc.set, path: path + '.<set ' + String(key) + '>', seen, auditFailures, options });
			}
			return undefined;
		}, auditFailures, path + '.<set ' + String(key) + '>');
	}
}
