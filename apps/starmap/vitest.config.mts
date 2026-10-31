/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			reportsDirectory: resolve(process.cwd(), 'test-result/apps/starmap/coverage'),
			include: ['apps/starmap/src/**/*.ts'],
			exclude: [
				'apps/starmap/src/**/*.spec.ts',
				'apps/starmap/src/**/*.test.ts',
				'apps/starmap/src/test-setup.ts',
				'apps/starmap/src/index.ts',
				'apps/starmap/src/lib/**/*.model.ts'
			]
		}
	}
});
