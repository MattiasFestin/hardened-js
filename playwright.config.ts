import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'test/e2e/playwright',
	timeout: 30_000,
	expect: {
		timeout: 5000
	},
	fullyParallel: true,
	reporter: [['list']],
	use: {
		headless: true,
		viewport: { width: 1280, height: 720 },
		actionTimeout: 5000,
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		}
	]
});
