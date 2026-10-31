/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import base from './vitest.config.mts';

export default {
	...base,
	test: {
		...(base as any).test,
		// e2e: kein Parallel-Kram in CI
		fileParallelism: false,
		pool: 'forks',
		maxWorkers: 1,
		// optional: etwas mehr Luft
		testTimeout: 30_000,
		hookTimeout: 30_000
	}
};
