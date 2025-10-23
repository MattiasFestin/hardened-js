import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.test.*'],
		exclude: ['test/e2e/**', 'playwright.config.ts', 'node_modules/**'],
		environment: 'node'
	}
});
