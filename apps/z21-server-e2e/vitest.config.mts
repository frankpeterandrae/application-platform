/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/apps/z21-server-e2e'),
	plugins: [tsconfigPaths()],
	test: {
		environment: 'node',
		globals: true,
		// first ensure the CLI is built, then run project test setup
		setupFiles: [resolve(__dirname, 'src/test-setup.ts'), resolve(process.cwd(), 'vitest.setup.ts')],
		reporters: ['html', 'default', 'verbose'],
		outputFile: resolve(process.cwd(), 'test-result/apps/z21-server-e2e/index.html'),
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		passWithNoTests: true,
		// increase test timeout for slower CI/host environments
		testTimeout: 20000,
		// disable worker threads to make startup deterministic in CI
		coverage: {
			provider: 'v8',
			reporter: ['html', 'text', 'lcov']
		}
	}
});
