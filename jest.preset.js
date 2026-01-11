/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

const nxPreset = require('@nx/jest/preset').default;

module.exports = {
	...nxPreset,
	collectCoverage: true,
	coverageDirectory: '<rootDir>/coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest' // Ensure ts-jest transforms TypeScript files
	},
	transformIgnorePatterns: [
		'node_modules/(?!(.*\\.mjs$|flat))', // Allow Jest to process the `flat` package
		'\\.d\\.ts$' // Ignore TypeScript declaration files explicitly
	],
	moduleNameMapper: {
		'^flat$': 'node_modules/flat/index.js' // Map flat to its JS entry
	}
};
