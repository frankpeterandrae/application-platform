/*
 * Copyright (c) 2024-2025. Frank-Peter Andrä
 * All rights reserved.
 */

const nx = require('@nx/eslint-plugin');
const baseConfig = require('../../../eslint.config.js');
require('@typescript-eslint/eslint-plugin');

module.exports = [
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
			]
		}
	},
	{
		files: ['**/*.html'],
		// Override or add rules here
		rules: {}
	},
	{
		files: ['**/*.ts'],
		rules: {
			'@angular-eslint/prefer-standalone': 'off'
		}
	}
];
