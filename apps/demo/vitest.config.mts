/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			reportsDirectory: resolve(process.cwd(), 'test-result/apps/demo/coverage'),
			include: ['apps/demo/src/**/*.ts'],
			exclude: [
				'apps/demo/src/**/*.spec.ts',
				'apps/demo/src/**/*.test.ts',
				'apps/demo/src/test-setup.ts',
				'apps/demo/src/index.ts',
				'apps/demo/src/lib/**/*.model.ts'
			]
		}
	}
});
