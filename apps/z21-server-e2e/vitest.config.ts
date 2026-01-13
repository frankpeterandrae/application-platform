/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	test: {
		environment: 'node',
		globals: true,
		// first ensure the CLI is built, then run project test setup
		setupFiles: ['./src/setup-build.ts', './src/test-setup.ts', resolve(process.cwd(), 'vitest.setup.ts')],
		reporters: ['default', 'verbose'],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		passWithNoTests: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov']
		}
	}
});
