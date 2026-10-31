/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			reportsDirectory: resolve(process.cwd(), 'test-result/apps/stream-overlay-ui/coverage'),
			include: ['apps/stream-overlay-ui/src/**/*.ts'],
			exclude: [
				'apps/stream-overlay-ui/src/**/*.spec.ts',
				'apps/stream-overlay-ui/src/**/*.test.ts',
				'apps/stream-overlay-ui/src/test-setup.ts',
				'apps/stream-overlay-ui/src/index.ts',
				'apps/stream-overlay-ui/src/lib/**/*.model.ts'
			]
		}
	}
});
