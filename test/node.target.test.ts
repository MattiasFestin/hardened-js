import { describe, it, expect } from 'vitest';
import { buildSync } from 'esbuild';
import vm from 'vm';
import path from 'path';

function runInVmBundle(helperPath: string, builtinName: string, opts?: { skip?: string[]; ignoreReadonlyConstructorError?: boolean }) {
  const res = buildSync({ entryPoints: [helperPath], bundle: true, platform: 'node', format: 'cjs', write: false });
  const code = res.outputFiles[0].text;

  const context: any = { console: { log: () => {} }, Buffer, process, setTimeout, clearTimeout, require, module: { exports: {} }, exports: {} };
  vm.createContext(context);
  const script = new vm.Script(code + `\n// call helper\nglobalThis.__NODE_TARGET_HELPER__ && globalThis.__NODE_TARGET_HELPER__.run(${JSON.stringify(builtinName)}, ${JSON.stringify(opts || {})});`, { filename: 'node-target-helper.vm.js' });
  const result = script.runInContext(context, { timeout: 2000 });
  return result;
}

describe('node target (vm-isolated)', () => {
  it('runs a small sample of builtins inside a vm', () => {
  const helperPath = path.join(process.cwd(), 'test', 'helpers', 'node.target.test.helper.ts');
    const sample = ['Object', 'Array', 'Function'];
    for (const name of sample) {
      const r = runInVmBundle(helperPath, name, { skip: ['module','require','exports','process','Buffer','console','global'], ignoreReadonlyConstructorError: true });
      expect(r).toHaveProperty('builtinName', name);
      // Either the assignment threw (threw === true) or no property was created (has === false)
      expect(r.threw === true || r.has === false).toBe(true);
    }
  });
});
