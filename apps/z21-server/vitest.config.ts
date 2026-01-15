/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/libs/z21-suite/protocol'),
	plugins: [tsconfigPaths()],
	test: {
		environment: 'node',
		globals: true,
		reporters: ['default', 'verbose'],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		passWithNoTests: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov']
		}
	}
});
