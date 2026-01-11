/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { angularJestBase } from '../../../tools/jest/angular-jest.base.js';

export default {
	...angularJestBase,
	displayName: 'demo-feature',
	preset: '../../../jest.preset.js',
	coverageDirectory: '<rootDir>/../../../coverage/libs/demo/demo-feature'
};
