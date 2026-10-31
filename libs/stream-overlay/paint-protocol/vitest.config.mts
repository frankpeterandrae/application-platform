/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: import.meta.dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/libs/stream-overlay/paint-protocol'),
	plugins: [angular()],
	resolve: { tsconfigPaths: true },
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts', resolve(import.meta.dirname, '../../../vitest.setup.ts')],
		reporters: [
			['html', { outputDir: resolve(process.cwd(), 'test-result/libs/stream-overlay/paint-protocol') }],
			'default',
			'verbose'
		],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		coverage: {
			reportsDirectory: resolve(import.meta.dirname, '../../../test-result/libs/stream-overlay/paint-protocol/coverage'),
			provider: 'v8',
			reporter: ['html', 'text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/test-setup.ts', 'src/index.ts', 'src/lib/**/*.model.ts']
		}
	}
});
