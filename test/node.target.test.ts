import { describe, it, expect } from 'vitest';
import { buildSync } from 'esbuild';
import vm from 'vm';
import path from 'path';

describe('node target (vm-isolated) - minimal removeNode test', () => {
	it('removeNode removes and reports a top-level property inside vm', (): void => {
		const helperPath = path.join(process.cwd(), 'test', 'helpers', 'node.target.test.helper.ts');
		// create a top-level property inside the vm
		const res = buildSync({ entryPoints: [helperPath], bundle: true, platform: 'node', format: 'cjs', write: false });
		// create the TEMP_RM object and immediately call the helper's runRemove inside the VM
		const code = "globalThis.TEMP_RM = { a: 1 }; globalThis.__NODE_TARGET_HELPER__ && globalThis.__NODE_TARGET_HELPER__.runRemove && (globalThis.__LAST_REPORT__ = globalThis.__NODE_TARGET_HELPER__.runRemove(['TEMP_RM']));";
		const bundle = res.outputFiles[0].text + '\n' + code + '\n';
		const safeProcess = { exit: () => { /* noop in VM */ }, on: () => { }, removeListener: () => { }, _events: {}, env: process.env } as any;
		const context: any = {
			console: { log: () => { } },
			Buffer,
			process: safeProcess,
			setTimeout,
			clearTimeout,
			require,
			module: { exports: {} },
			exports: {},
			globalThis: {}
		};
		vm.createContext(context);
		const script = new vm.Script(bundle, { filename: 'node-target-remove.vm.js' });
		script.runInContext(context, { timeout: 2000 });
		const out = context.globalThis && context.globalThis.__LAST_REPORT__ ? context.globalThis.__LAST_REPORT__ : null;
		expect(out && out.report).toBeTruthy();
		expect(out.report.removed).toContain('TEMP_RM');
	});
});
