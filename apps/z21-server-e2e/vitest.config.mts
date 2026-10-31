/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: import.meta.dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/apps/z21-server-e2e'),
	resolve: { tsconfigPaths: true },
	test: {
		environment: 'node',
		globals: true,
		// first ensure the CLI is built, then run project test setup
		setupFiles: [resolve(import.meta.dirname, 'src/test-setup.ts'), resolve(process.cwd(), 'vitest.setup.ts')],
		reporters: [['html', { outputDir: resolve(process.cwd(), 'test-result/apps/z21-server-e2e') }], 'default', 'verbose'],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		passWithNoTests: true,
		// increase test timeout for slower CI/host environments
		testTimeout: 20000,
		// disable worker threads to make startup deterministic in CI
		coverage: {
			reportsDirectory: resolve(import.meta.dirname, '../../test-result/apps/z21-server-e2e/coverage'),
			provider: 'v8',
			reporter: ['html', 'text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/test-setup.ts', 'src/index.ts', 'src/lib/**/*.model.ts']
		}
	}
});
