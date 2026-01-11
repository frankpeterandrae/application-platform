/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { angularJestBase } from '../../../tools/jest/angular-jest.base.js';

export default {
	...angularJestBase,
	displayName: 'services',
	preset: '../../../jest.preset.js',
	coverageDirectory: '<rootDir>/../../../coverage/libs/shared/services'
};
