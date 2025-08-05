/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import nx from '@nx/eslint-plugin';

import '@typescript-eslint/eslint-plugin';
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
					prefix: 'fpaSharedUi',
					style: 'camelCase'
				}
			],
			'@angular-eslint/component-selector': [
				'error',
				{
					type: 'element',
					prefix: 'fpa-shared-ui',
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
