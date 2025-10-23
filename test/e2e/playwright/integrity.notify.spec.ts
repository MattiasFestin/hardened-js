import { test, expect } from '@playwright/test';
import http from 'http';
import handler from 'serve-handler';

test.describe('integrity worker notifications', () => {
	let server: http.Server | null = null;
	const port = 9236;

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

	test('notify path calls Notification when permission granted', async ({ page }) => {
		await page.goto(`http://localhost:${port}/test/e2e/playwright/fixture.html`);

		// mock Notification API and grant permission
		await page.evaluate(() => {
			(window as any).Notification = function (title: string, opts: any) {
				(window as any).__NOTIFIED__ = { title, opts };
			};
			(window as any).Notification.permission = 'granted';
		});

		// enable worker with test trigger exposed
		const enabled = await page.evaluate(() => {
			const en = (window as any).HARDENED && (window as any).HARDENED.enableIntegrityWorker;
			if (!en) {
				return false;
			}
			const r = en({ intervalMs: 100, exposeTestTrigger: true });
			(window as any).__INTEG_STOP__ = r && r.stop ? r.stop : null;
			return !!r;
		});

		expect(enabled).toBe(true);

		// trigger notify from worker-side
		await page.evaluate(() => {
			try {
				(window as any).__INTEG_TRIGGER_NOTIFY__ && (window as any).__INTEG_TRIGGER_NOTIFY__();
			} catch (e) { }
		});

		// wait and assert Notification was called
		const notified = await page.waitForFunction(() => !!(window as any).__NOTIFIED__, null, { timeout: 2000 });
		expect(await notified.jsonValue()).toBeTruthy();

		// cleanup
		await page.evaluate(() => {
			try {
				const s = (window as any).__INTEG_STOP__;
				if (s) {
					s();
				}
			} catch (e) { }
			try { delete (window as any).__INTEG_TRIGGER_NOTIFY__; } catch (e) { }
			try { delete (window as any).__NOTIFIED__; } catch (e) { }
		});
	});
});
