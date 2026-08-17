/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: [
			'**/vite.config.{mjs,js,ts,mts}',
			'**/vitest.config.{mjs,js,ts,mts}',
			'!vitest.config.{mjs,js,ts,mts}',
			'!vite.config.{mjs,js,ts,mts}'
		],
		globals: true
	}
});
