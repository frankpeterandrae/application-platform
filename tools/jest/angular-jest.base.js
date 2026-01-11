/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// CommonJS companion for the TypeScript helper so Node can import it when loading jest config files.
module.exports.angularJestBase = {
	setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
	transform: {
		'^.+\\.(ts|mjs|js|html)$': [
			'jest-preset-angular',
			{ tsconfig: '<rootDir>/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' }
		]
	},
	snapshotSerializers: [
		'jest-preset-angular/build/serializers/no-ng-attributes',
		'jest-preset-angular/build/serializers/ng-snapshot',
		'jest-preset-angular/build/serializers/html-comment'
	]
};
