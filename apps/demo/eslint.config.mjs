/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import nx from '@nx/eslint-plugin';

import baseConfig from '../../eslint.config.mjs';
import '@typescript-eslint/eslint-plugin';

export default [
	...baseConfig,

	// Angular (TS) + inline templates
	...nx.configs['flat/angular'],

	// Angular HTML templates
	...nx.configs['flat/angular-template'],

	// Deine Lib-spezifischen Selector-Regeln
	{
		files: ['**/*.ts'],
		rules: {
			'@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'demo', style: 'camelCase' }],
			'@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'demo', style: 'kebab-case' }],

			// wenn du noch nicht auf standalone umstellen willst
			'@angular-eslint/prefer-standalone': 'off'
		}
	}
];
