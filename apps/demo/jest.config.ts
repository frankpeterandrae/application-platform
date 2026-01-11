/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Import the JS companion at runtime so Node's ESM loader can resolve it when parsing jest configs.
// TypeScript will still pick up the original .ts for type information during dev builds.
import { angularJestBase } from '../../tools/jest/angular-jest.base.js';

export default {
	...angularJestBase,
	displayName: 'demo',
	preset: '../../jest.preset.js',
	coverageDirectory: '<rootDir>/../../coverage/apps/demo'
};
