import { hardenNode } from '../../src/targets/node';

// This helper is intended to be bundled and executed inside a vm.Context.
// It mirrors the style of the javascript test helper: call hardenNode()
// early, then attempt a strict-mode assignment to a given builtin and
// return whether that assignment threw.

function tryModifyBuiltinAssignment(builtinName: string) {
  let caught: any = null;
  try {
    (function () { 'use strict';
      // @ts-ignore - intentionally referencing globals by name
      (globalThis as any)[builtinName].INJECTED_TEST_PROP = 12345;
    })();
  } catch (e) {
    caught = e;
  }
  return caught;
}

;(globalThis as any).__NODE_TARGET_HELPER__ = {
  run(builtinName: string, opts?: { skip?: string[]; ignoreReadonlyConstructorError?: boolean }) {
    try {
      // allow caller to pass a conservative skip list
      hardenNode({ skip: opts?.skip, ignoreReadonlyConstructorError: !!opts?.ignoreReadonlyConstructorError });
    } catch (e) {
      // swallow — caller will observe behavior via strict-mode assignment
    }
    const err = tryModifyBuiltinAssignment(builtinName);
      // Also report whether the property exists after the attempt. This lets the
      // caller assert either that assignment threw or that the property wasn't
      // created (environments may behave differently).
      // @ts-ignore
      const has = Object.prototype.hasOwnProperty.call((globalThis as any)[builtinName] || {}, 'INJECTED_TEST_PROP');
      return { builtinName, threw: !!err, has };
  }
};

export {};
