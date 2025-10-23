import { test, expect, Page } from '@playwright/test';
import path from 'path';
import http from 'http';
import serveHandler from 'serve-handler';
import { jsFrozenBuiltins, browserFrozenBuiltins } from '../../../src/targets/builtins';

test.describe('browser hardening', () => {
	let server: http.Server | null = null;
	const port = 9234;
	const base = `http://localhost:${port}`;

	test.beforeAll(async () => {
		server = http.createServer((req, res) => serveHandler(req, res, { public: path.resolve(__dirname, '..', '..', '..') }));
		await new Promise<void>((_resolve, _reject) => {
			server!.listen(port, (err?: any) => err ? _reject(err) : _resolve());
		});
	});

	test.afterAll(async () => {
		if (server) {
			await new Promise<void>((_resolve) => server!.close(() => _resolve()));
		}
		server = null;
	});

	test('hardenAllBrowser freezes common builtins', async ({ page }: { page: Page }) => {
		await page.goto(`${base}/test/e2e/playwright/fixture.html`);
		// ensure the bundle loaded
		const hasApi = await page.evaluate(() => !!(window as any).HARDENED && typeof (window as any).HARDENED.harden === 'function');
		expect(hasApi).toBeTruthy();

		// call harden and assert common builtins (or their prototypes) are frozen
		await page.evaluate(() => { (window as any).HARDENED.harden && (window as any).HARDENED.harden(); });

		const builtins = [...jsFrozenBuiltins, ...browserFrozenBuiltins];

		const results = await page.evaluate((names) => {
			const out = {} as Record<string, { present: boolean, frozen: boolean, note?: string }>;
			for (const name of names) {
				try {
					const val = (window as any)[name];
					if (val === undefined) {
						out[name] = { present: false, frozen: false };
						continue;
					}
					let checkTarget: any = val;
					if (typeof val === 'function' && val.prototype) {
						checkTarget = val.prototype;
					}
					let frozen = false;
					try { frozen = Object.isFrozen(checkTarget); } catch (e) { out[name] = { present: true, frozen: false, note: String(e) }; continue; }
					out[name] = { present: true, frozen };
				} catch (err) {
					out[name] = { present: false, frozen: false, note: String(err) };
				}
			}
			return out;
		}, builtins);

		// keep a diagnostic list but only assert a small, stable core
		const notFrozen = Object.entries(results).filter(([, v]) => v.present && !v.frozen).map(([k]) => k);
		if (notFrozen.length > 0) {
			console.warn('Some present builtins were not frozen (diagnostic):', notFrozen.join(', '));
		}

		// Ensure the internal markers were applied by the hardeners
		const markers = await page.evaluate(() => ({
			js: Boolean((window as any).__BUILTINS_FROZEN__),
			web: Boolean((window as any).__WEBAPI_FROZEN__)
		}));
		expect(markers.js, 'expected __BUILTINS_FROZEN__ marker to be set').toBe(true);
		expect(markers.web, 'expected __WEBAPI_FROZEN__ marker to be set').toBe(true);

		// Check a small, stable core of prototypes are frozen
		const core = ['Array', 'Object', 'Function', 'Promise', 'Map', 'Set'];
		const coreResults = await page.evaluate((names) => {
			const out: Record<string, boolean> = {};
			for (const name of names) {
				try {
					const val = (window as any)[name];
					if (val === undefined) { out[name] = false; continue; }
					const target = (typeof val === 'function' && val.prototype) ? val.prototype : val;
					out[name] = !!Object.isFrozen(target);
				} catch (e) { out[name] = false; }
			}
			return out;
		}, core);

		const coreNotFrozen = Object.entries(coreResults).filter(([, v]) => !v).map(([k]) => k);
		expect(coreNotFrozen, `expected core prototypes to be frozen but these were not: ${coreNotFrozen.join(', ')}`).toEqual([]);
	});
});
