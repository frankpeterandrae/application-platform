/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/libs/homepage/config'),
	plugins: [angular(), tsconfigPaths()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts', resolve(__dirname, '../../../vitest.setup.ts')],
		reporters: ['html', 'default', 'verbose'],
		outputFile: resolve(process.cwd(), 'test-result/libs/homepage/config/index.html'),
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['html', 'text', 'lcov']
		}
	}
});
