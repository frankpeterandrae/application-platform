/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/shared-services'),
	resolve: {
		alias: {
			'@application-platform/colour-rack': resolve(__dirname, '../../homepage/colour-rack/src/index.ts'),
			'@application-platform/config': resolve(__dirname, '../../homepage/config/src/index.ts'),
			'@application-platform/demo-feature': resolve(__dirname, '../../demo/demo-feature/src/index.ts'),
			'@application-platform/homepage-feature': resolve(__dirname, '../../homepage/homepage-feature/src/index.ts'),
			'@application-platform/interfaces': resolve(__dirname, '../../shared/interfaces/src/index.ts'),
			'@application-platform/services': resolve(__dirname, '../services/src/index.ts'),
			'@application-platform/shared/ui-theme': resolve(__dirname, '../../shared/ui-theme/src/index.ts'),
			'@application-platform/testing': resolve(__dirname, '../../shared/testing/src/index.ts'),
			'@application-platform/domain': resolve(__dirname, '../../z21-suite/domain/src/index.ts'),
			'@application-platform/protocol': resolve(__dirname, '../../z21-suite/protocol/src/index.ts'),
			'@application-platform/z21': resolve(__dirname, '../../z21-suite/z21/src/index.ts')
		}
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts'],
		reporters: ['default', 'verbose'],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov']
		}
	}
});
