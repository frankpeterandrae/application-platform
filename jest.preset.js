/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

const nxPreset = require('@nx/jest/preset').default;

module.exports = {
	...nxPreset,

	// Coverage: kann man so lassen, wenn ihr es wirklich immer wollt
	collectCoverage: true,
	coverageDirectory: '<rootDir>/coverage',
	coverageReporters: ['text', 'lcov', 'html'],

	// Sinnvoll, weil es das repo-weit standardisiert
	collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.spec.{ts,tsx}', '!src/**/*.d.ts'],
	coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
	coverageProvider: 'v8',

	// "flat" workaround (habt ihr beide schon)
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				isolatedModules: true,
				babelConfig: false,
				tsconfig: {
					jsx: 'react',
					esModuleInterop: true,
					allowSyntheticDefaultImports: true
				}
			}
		]
	},
	transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$|flat))'],
	moduleNameMapper: {
		'^flat$': 'node_modules/flat/index.js'
	}
};
