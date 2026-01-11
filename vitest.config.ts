/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/root'),
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./vitest.setup.ts'],
		reporters: ['default', 'verbose'],
		include: ['**/*.spec.ts', '**/*.test.ts', '**/*.vi.ts', '**/*.d.ts'],
		silent: false
	},
	resolve: {
		alias: {
			'@application-platform/colour-rack': resolve(__dirname, 'libs/homepage/colour-rack/src/index.ts'),
			'@application-platform/config': resolve(__dirname, 'libs/homepage/config/src/index.ts'),
			'@application-platform/demo-feature': resolve(__dirname, 'libs/demo/demo-feature/src/index.ts'),
			'@application-platform/homepage-feature': resolve(__dirname, 'libs/homepage/homepage-feature/src/index.ts'),
			'@application-platform/interfaces': resolve(__dirname, 'libs/shared/interfaces/src/index.ts'),
			'@application-platform/services': resolve(__dirname, 'libs/shared/services/src/index.ts'),
			'@application-platform/shared/ui-theme': resolve(__dirname, 'libs/shared/ui-theme/src/index.ts'),
			'@application-platform/testing': resolve(__dirname, 'libs/shared/testing/src/index.ts'),
			'@application-platform/domain': resolve(__dirname, 'libs/z21-suite/domain/src/index.ts'),
			'@application-platform/protocol': resolve(__dirname, 'libs/z21-suite/protocol/src/index.ts'),
			'@application-platform/z21': resolve(__dirname, 'libs/z21-suite/z21/src/index.ts')
		}
	}
});
