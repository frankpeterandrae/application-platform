/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: import.meta.dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/apps/z21-server'),
	resolve: { tsconfigPaths: true },
	test: {
		environment: 'node',
		globals: true,
		reporters: [['html', { outputDir: resolve(process.cwd(), 'test-result/apps/z21-server') }], 'default', 'verbose'],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		passWithNoTests: true,
		coverage: {
			reportsDirectory: resolve(import.meta.dirname, '../../test-result/apps/z21-server/coverage'),
			provider: 'v8',
			reporter: ['html', 'text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/test-setup.ts', 'src/index.ts', 'src/lib/**/*.model.ts']
		}
	}
});
