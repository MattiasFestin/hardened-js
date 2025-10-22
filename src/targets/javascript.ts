import { isObjectLike, freezeDeep } from '../utils/index';

// List of common built-in constructors/namespaces to freeze
export const jsFrozenBuiltins = [
  'Object', 'Function', 'Boolean', 'Symbol', 'Error', 'EvalError', 'RangeError', 'ReferenceError',
  'SyntaxError', 'TypeError', 'URIError', 'Number', 'BigInt', 'Math', 'Date', 'String', 'RegExp',
  'Array', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array',
  'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy', 'Reflect', 'JSON'
];

export let hardenJs: (opts?: { ignoreReadonlyConstructorError?: boolean }) => void = function _hardenJs(opts?: { ignoreReadonlyConstructorError?: boolean }): void {
  'use strict';
  const GLOBAL: any = typeof window !== 'undefined' ? window : (globalThis as any);
  const ignoreCtorErr = !!(opts && opts.ignoreReadonlyConstructorError);
  let _origUncaught: any;
  if (ignoreCtorErr && typeof process !== 'undefined' && (process as any).on) {
    _origUncaught = (process as any)._events && (process as any)._events['uncaughtException'];
    (process as any).on('uncaughtException', function _harden_ignore(err: any) {
      try {
        const msg = err && err.message ? err.message : String(err);
        if (msg && msg.includes("Cannot assign to read only property 'constructor'")) {
          return;
        }
      } catch (e) { }
      throw err;
    });
  }

  // Run freezeDeep on selected builtins and their prototypes
  for (const name of jsFrozenBuiltins) {
    try {
      const target = GLOBAL[name];
        if (isObjectLike(target)) {
        freezeDeep(target, name, undefined, undefined, { skipKeys: ['constructor'] });
        // Also freeze prototype objects when available
        if (target.prototype && isObjectLike(target.prototype)) {
          freezeDeep(target.prototype, name + '.prototype', undefined, undefined, { skipKeys: ['constructor'] });
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Extra: freeze Object.prototype (very powerful — may have side-effects)
  try { /* avoid freezing Object.prototype by default in tests */ } catch (e) { }

  // Mark that we've run (can be used as a checkpoint)
  try { Object.defineProperty(GLOBAL, '__BUILTINS_FROZEN__', { value: true, configurable: false, writable: false }); } catch (e) { }
  // Replace exported binding with a noop so subsequent calls do nothing.
  try {
    hardenJs = function () { /* noop - already hardened */ };
  } catch (e) { /* ignore if reassignment not allowed */ }
  if (ignoreCtorErr && typeof process !== 'undefined' && (process as any).removeListener) {
    try { (process as any).removeListener('uncaughtException', (process as any)._events && (process as any)._events['uncaughtException']); } catch (e) { }
    try { if (_origUncaught) (process as any).on('uncaughtException', _origUncaught); } catch (e) { }
  }
};
