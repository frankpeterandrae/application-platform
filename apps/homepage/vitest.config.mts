/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			reportsDirectory: resolve(process.cwd(), 'test-result/apps/homepage/coverage'),
			include: ['apps/homepage/src/**/*.ts'],
			exclude: [
				'apps/homepage/src/**/*.spec.ts',
				'apps/homepage/src/**/*.test.ts',
				'apps/homepage/src/test-setup.ts',
				'apps/homepage/src/index.ts',
				'apps/homepage/src/lib/**/*.model.ts'
			]
		}
	}
});
