/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: import.meta.dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/apps/stream-deck-paint-selector'),
	plugins: [tsconfigPaths()],
	test: {
		environment: 'node',
		globals: true,
		reporters: ['html', 'default', 'verbose'],
		outputFile: resolve(process.cwd(), 'test-result/apps/stream-deck-paint-selector/index.html'),
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		passWithNoTests: true,
		coverage: {
			provider: 'v8',
			reporter: ['html', 'text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/main.ts']
		}
	}
});
