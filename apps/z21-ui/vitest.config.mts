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
			include: ['apps/z21-ui/src/**/*.ts'],
			exclude: [
				'apps/z21-ui/src/**/*.spec.ts',
				'apps/z21-ui/src/**/*.test.ts',
				'apps/z21-ui/src/test-setup.ts',
				'apps/z21-ui/src/index.ts',
				'apps/z21-ui/src/lib/**/*.model.ts'
			]
		}
	}
});
