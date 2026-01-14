/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	test: {
		environment: 'node',
		globals: true,
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		passWithNoTests: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			reportsDirectory: '../../coverage/apps/z21-server'
		}
	}
});
