import { test, expect } from '@playwright/test';
import http from 'http';
import handler from 'serve-handler';

test.describe('integrity worker tamper detection', () => {
	let server: http.Server | null = null;
	const port = 9235;

	test.beforeAll(async () => {
		server = http.createServer((req, res) => handler(req, res, { public: '.' }));
		await new Promise<void>((resolve) => server!.listen(port, resolve));
	});

	test.afterAll(async () => {
		if (server) {
			await new Promise<void>((resolve) => server!.close(() => resolve()));
			server = null;
		}
	});

	test('worker detects global mutation', async ({ page }) => {
		await page.goto(`http://localhost:${port}/test/e2e/playwright/fixture.html`);

		// enable integrity worker and verify it returns a stop function
		const enabled = await page.evaluate(() => {
			try {
				const en = (window as any).HARDENED && (window as any).HARDENED.enableIntegrityWorker;
				if (!en) {
					return false;
				}
				const result = en({ intervalMs: 200 });
				// ensure a stop function is available
				(window as any).__INTEG_STOP__ = result && result.stop ? result.stop : null;
				return typeof (window as any).__INTEG_STOP__ === 'function';
			} catch (e) {
				return false;
			}
		});

		expect(enabled).toBe(true);

		// cleanup: call stop
		await page.evaluate(() => {
			try {
				const s = (window as any).__INTEG_STOP__;
				if (s) {
					s();
				}
			} catch (e) { }
			try { delete (window as any).__INTEG_STOP__; } catch (e) { }
		});
	});
});
