/*
 * Copyright (c) 2024-2025. Frank-Peter Andrä
 * All rights reserved.
 */

const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('../../../eslint.config.js');
const js = require('@eslint/js');
require('@typescript-eslint/eslint-plugin');

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended
});

module.exports = [
	...baseConfig,
	...compat
		.config({
			extends: [
				'plugin:@nx/angular',
				'plugin:@angular-eslint/recommended',
				'plugin:@angular-eslint/template/process-inline-templates'
			]
		})
		.map((config) => ({
			...config,
			files: ['**/*.ts'],
			rules: {
				...config.rules,
				'@angular-eslint/directive-selector': [
					'error',
					{
						type: 'attribute',
						prefix: 'theme',
						style: 'camelCase'
					}
				],
				'@angular-eslint/component-selector': [
					'error',
					{
						type: 'element',
						prefix: 'theme',
						style: 'kebab-case'
					}
				],
				'@angular-eslint/pipe-prefix': [
					'error',
					{
						prefixes: ['theme']
					}
				]
			}
		})),
	...compat.config({ extends: ['plugin:@nx/angular-template'] }).map((config) => ({
		...config,
		files: ['**/*.html'],
		rules: {
			...config.rules
		}
	})),
	{
		files: ['**/*.ts'],
		rules: {
			'@angular-eslint/prefer-standalone': 'off'
		}
	}
];
