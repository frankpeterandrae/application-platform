/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import playwright from 'eslint-plugin-playwright';

import baseConfig from '../../eslint.config.mjs';

export default [
	playwright.configs['flat/recommended'],
	...baseConfig,
	{
		files: ['**/*.ts', '**/*.js'],
		// Override or add rules here
		rules: {}
	}
];
