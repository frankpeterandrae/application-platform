/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/apps/stream-overlay-server'),
	plugins: [tsconfigPaths()],
	test: {
		environment: 'node',
		globals: true,
		reporters: ['html', 'default', 'verbose'],
		outputFile: resolve(process.cwd(), 'test-result/apps/stream-overlay-server/index.html'),
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		passWithNoTests: true,
		coverage: {
			reporter: ['html', 'text', 'lcov'],
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/test-setup.ts', 'src/index.ts', 'src/lib/**/*.model.ts']
		}
	}
});
