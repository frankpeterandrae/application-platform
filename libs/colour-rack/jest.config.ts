/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { angularJestBase } from '../../tools/jest/angular-jest.base.js';

export default {
	...angularJestBase,
	displayName: 'colour-rack',
	preset: '../../jest.preset.js',
	coverageDirectory: '<rootDir>/../../coverage/libs/colour-rack'
};
