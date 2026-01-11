/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { angularJestBase } from '../../tools/jest/angular-jest.base.js';

export default {
	...angularJestBase,
	displayName: 'homepage',
	preset: '../../jest.preset.js',
	coverageDirectory: '<rootDir>/../../coverage/apps/homepage'
};
