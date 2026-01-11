/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export const angularJestBase = {
	setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
	transform: {
		'^.+\\.(ts|mjs|js|html)$': [
			'jest-preset-angular',
			{ tsconfig: '<rootDir>/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' }
		]
	},
	// Run TypeScript in isolated mode for jest transforms to avoid sharing a
	// single TypeScript program between parallel test runners which can cause
	// intermittent "Cannot find module" TS2307 errors when nx runs many tests
	// concurrently. This sacrifices some type-check diagnostics during tests but
	// makes the test runs deterministic and CI-friendly.
	globals: {
		'ts-jest': {
			isolatedModules: true,
			diagnostics: false
		}
	},
	snapshotSerializers: [
		'jest-preset-angular/build/serializers/no-ng-attributes',
		'jest-preset-angular/build/serializers/ng-snapshot',
		'jest-preset-angular/build/serializers/html-comment'
	]
};
