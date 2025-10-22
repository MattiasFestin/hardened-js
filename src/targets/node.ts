import { isObjectLike, freezeDeep } from '../utils/index';

export const nodeFrozenBuiltins = [
    // ECMAScript builtins
    'Object','Function','Boolean','Symbol','Error','RangeError','ReferenceError',
    'SyntaxError','TypeError','URIError','Number','BigInt','Math','Date','String',
    'RegExp','Array','Map','Set','WeakMap','WeakSet','Promise','Reflect','JSON','Intl',
    // Typed arrays
    'ArrayBuffer','SharedArrayBuffer','DataView','Int8Array','Uint8Array','Uint8ClampedArray',
    'Int16Array','Uint16Array','Int32Array','Uint32Array','Float32Array','Float64Array',
    'BigInt64Array','BigUint64Array',
    // Node & environment globals
    'global', // will map to global object
    'Buffer', 'console', 'process', 'require', 'module', 'exports',
    'setTimeout','clearTimeout','setInterval','clearInterval','setImmediate','clearImmediate',
    // URL / networking
    'URL','URLSearchParams',
  ];

export let hardenNode: (opts?: { skip?: string[]; ignoreReadonlyConstructorError?: boolean }) => void = function _hardenNode(opts?: { skip?: string[]; ignoreReadonlyConstructorError?: boolean }): void {
  const G: any = typeof global !== 'undefined' ? global : (globalThis as any);
  const seen = new WeakSet<any>();
  const auditFailures: Array<{ path: string; err: string }> = [];

  const skipSet = new Set<string>((opts && opts.skip) || []);
  const ignoreCtorErr = !!(opts && opts.ignoreReadonlyConstructorError);
  let _origUncaught: any;
  if (ignoreCtorErr && typeof process !== 'undefined' && (process as any).on) {
    _origUncaught = (process as any)._events && (process as any)._events['uncaughtException'];
    (process as any).on('uncaughtException', function _harden_ignore(err: any) {
      try {
        const msg = err && err.message ? err.message : String(err);
        if (msg && msg.includes("Cannot assign to read only property 'constructor'")) {
          // record and swallow
          auditFailures.push({ path: '<internal>', err: msg });
          return;
        }
      } catch (e) { }
      // rethrow otherwise so normal handling happens
      throw err;
    });
  }

  function freezeDeepLocal(obj: any, path = '<root>') {
    freezeDeep(obj, path, seen as any, auditFailures, { skipKeys: ['constructor'] });
  }

  // List of Node/JS objects to freeze (can be extended)
  

  // Run freezeDeep on the list (if defined on the global)
  for (const name of nodeFrozenBuiltins) {
    if (skipSet.has(name)) continue;
    try {
      let target: any;
      if (name === 'global') target = G;
      else target = G[name];
      if (isObjectLike(target)) {
        freezeDeepLocal(target, name);
        if (target.prototype && isObjectLike(target.prototype)) {
          freezeDeepLocal(target.prototype, name + '.prototype');
        }
      }
    } catch (e) {
      auditFailures.push({ path: name, err: e && (e as Error).message ? (e as Error).message : String(e) });
    }
  }

//   // Extra: freeze global prototype-abstract (less useful in Node but try)
//   try {
//     if (Object.prototype) freezeDeepLocal(Object.prototype, 'Object.prototype');
//   } catch (e) {
//     auditFailures.push({ path: 'Object.prototype', err: 'freeze failed' });
//   }

  // Mark that we've run
  try {
    Object.defineProperty(G, '__NODE_BUILTINS_FROZEN__', { value: true, configurable: false, writable: false });
  } catch (e) {
    auditFailures.push({ path: '__NODE_BUILTINS_FROZEN__', err: e && (e as Error).message ? (e as Error).message : String(e) });
  }

  // If there were failures, log a short summary (avoid throwing during logging)
  try {
    if (auditFailures.length && typeof console !== 'undefined' && (console as any).warn) {
      (console as any).warn('freeze-node-builtins: audit failures (first 50):', auditFailures.slice(0, 50));
    }
  } catch (e) { /* ignore logging errors */ }

  // Replace this exported function with a noop so subsequent calls do nothing.
  try {
    hardenNode = function () { /* noop - already hardened */ } as any;
  } catch (e) { /* ignore if reassignment not allowed */ }
  // remove temporary handler if installed
  if (ignoreCtorErr && typeof process !== 'undefined' && (process as any).removeListener) {
    try { (process as any).removeListener('uncaughtException', (process as any)._events && (process as any)._events['uncaughtException']); } catch (e) { }
    try { if (_origUncaught) (process as any).on('uncaughtException', _origUncaught); } catch (e) { }
  }
};
