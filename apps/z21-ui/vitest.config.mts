/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			reportsDirectory: resolve(process.cwd(), 'test-result/apps/z21-ui/coverage'),
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts', 'src/test-setup.ts', 'src/index.ts', 'src/lib/**/*.model.ts']
		}
	}
});
