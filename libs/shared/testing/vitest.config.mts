/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/libs/shared/testing'),
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts'],
		reporters: ['html', 'default', 'verbose'],
		outputFile: resolve(process.cwd(), 'test-result/libs/shared/testing/index.html'),
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['html', 'text', 'lcov']
		}
	}
});
