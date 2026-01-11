/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import nx from '@nx/eslint-plugin';

import baseConfig from '../../../eslint.config.mjs';
import '@typescript-eslint/eslint-plugin';

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
					prefix: 'sharedServices',
					style: 'camelCase'
				}
			],
			'@angular-eslint/component-selector': [
				'error',
				{
					type: 'element',
					prefix: 'shared-services',
					style: 'kebab-case'
				}
			],
			'@angular-eslint/pipe-prefix': [
				'error',
				{
					prefixes: ['fpa']
				}
			],
			'@angular-eslint/prefer-standalone': 'off'
		}
	}
];
