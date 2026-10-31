/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: import.meta.dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/apps/streamdeck/paint-selector-plugin'),
	resolve: { tsconfigPaths: true },
	test: {
		environment: 'node',
		globals: true,
		reporters: [
			['html', { outputDir: resolve(process.cwd(), 'test-result/apps/streamdeck/paint-selector-plugin') }],
			'default',
			'verbose'
		],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		passWithNoTests: true,
		coverage: {
			reportsDirectory: resolve(import.meta.dirname, '../../../test-result/apps/streamdeck/paint-selector-plugin/coverage'),
			provider: 'v8',
			reporter: ['html', 'text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/main.ts']
		}
	}
});
