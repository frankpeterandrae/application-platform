/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { defineConfig } from 'vitest/config';
export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.test.ts'],
		restoreMocks: true,
		clearMocks: true,
		coverage: { provider: 'v8', include: ['src/**/*.ts'], exclude: ['src/styles.ts'] }
	}
});
