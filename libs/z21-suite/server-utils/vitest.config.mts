/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/libs/z21-suite/server-utils'),
	plugins: [tsconfigPaths()],
	test: {
		outputFile: resolve(process.cwd(), 'test-result/libs/z21-suite/server-utils/index.html'),
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts'],
		reporters: ['html', 'default', 'verbose'],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		coverage: {
			provider: 'v8' as const,
			reporter: ['html', 'text', 'lcov'],
			include: ['src/**/*.ts']
		}
	}
});
