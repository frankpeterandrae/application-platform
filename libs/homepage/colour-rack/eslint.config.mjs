/*
 * Copyright (c) 2025-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import nx from '@nx/eslint-plugin';

import baseConfig from '../../../eslint.config.mjs';

export default [
	...baseConfig,
	...nx.configs['flat/angular'],
	...nx.configs['flat/angular-template'],
	{
		files: ['**/*.ts'],
		rules: {
			'@angular-eslint/directive-selector': [
				'error',
				{
					type: 'attribute',
					prefix: 'cr',
					style: 'camelCase'
				}
			],
			'@angular-eslint/component-selector': [
				'error',
				{
					type: 'element',
					prefix: 'cr',
					style: 'kebab-case'
				}
			],
			'@angular-eslint/prefer-standalone': 'off'
		}
	}
];
