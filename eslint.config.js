/*
 * Copyright (c) 2024-2025. Frank-Peter Andrä
 * All rights reserved.
 */

const { FlatCompat } = require('@eslint/eslintrc');
const nxEslintPlugin = require('@nx/eslint-plugin');
const js = require('@eslint/js');
require('@typescript-eslint/eslint-plugin');

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended
});

module.exports = [
	{ plugins: { '@nx': nxEslintPlugin, jsdoc: require('eslint-plugin-jsdoc') } },
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
		rules: {
			'@nx/enforce-module-boundaries': [
				'error',
				{
					enforceBuildableLibDependency: true,
					allow: [],
					depConstraints: [
						{
							sourceTag: 'type:app',
							onlyDependOnLibsWithTags: ['type:api', 'type:feature', 'type:ui', 'type:testing', 'type:util']
						},
						{
							sourceTag: 'type:api',
							onlyDependOnLibsWithTags: ['type:ui', 'type:testing', 'type:util']
						},
						{
							sourceTag: 'type:feature',
							onlyDependOnLibsWithTags: ['type:ui', 'type:testing', 'type:util']
						},
						{
							sourceTag: 'type:ui',
							onlyDependOnLibsWithTags: ['type:testing', 'type:util']
						},
						{
							sourceTag: 'type:testing',
							onlyDependOnLibsWithTags: ['type:util']
						},
						{
							sourceTag: 'scope:shared',
							onlyDependOnLibsWithTags: ['scope:shared']
						},
						{
							sourceTag: 'scope:web',
							onlyDependOnLibsWithTags: ['scope:web', 'scope:shared']
						},
						{
							sourceTag: 'scope:demo',
							onlyDependOnLibsWithTags: ['scope:demo', 'scope:shared']
						}
					]
				}
			]
		}
	},
	...compat.config({ extends: ['plugin:@nx/typescript', 'prettier'] }).map((config) => ({
		...config,
		ignores: ['**/*.spec.ts', '**/*.mock.ts'],
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		rules: {
			...config.rules,
			'@typescript-eslint/no-explicit-any': 'warn',
			'no-console': 'error',
			'@/no-extra-semi': 'error',
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/explicit-member-accessibility': [
				'error',
				{
					ignoredMethodNames: [
						'ngOnInit',
						'ngOnChanges',
						'ngAfterViewInit',
						'ngAfterViewChecked',
						'ngOnDestroy',
						'ngAfterContentInit',
						'onResize',
						'ngDoCheck'
					],
					overrides: {
						properties: 'explicit',
						constructors: 'no-public'
					}
				}
			],
			'jsdoc/check-access': ['error'],
			'jsdoc/check-alignment': ['error'],
			'jsdoc/check-examples': ['off'],
			'jsdoc/check-indentation': ['warn'],
			'jsdoc/check-line-alignment': ['warn'],
			'jsdoc/check-param-names': ['error'],
			'jsdoc/check-template-names': ['warn'],
			'jsdoc/check-property-names': ['error'],
			'jsdoc/check-syntax': ['warn'],
			'jsdoc/check-tag-names': ['error'],
			'jsdoc/check-types': ['error'],
			'jsdoc/check-values': ['error'],
			'jsdoc/empty-tags': ['error'],
			'jsdoc/implements-on-classes': ['error'],
			'jsdoc/informative-docs': ['warn'],
			'jsdoc/match-description': ['warn'],
			'jsdoc/multiline-blocks': ['error'],
			'jsdoc/no-bad-blocks': ['warn'],
			'jsdoc/no-blank-block-descriptions': ['warn'],
			'jsdoc/no-defaults': ['warn'],
			'jsdoc/no-missing-syntax': ['off'],
			'jsdoc/no-multi-asterisks': ['error'],
			'jsdoc/no-restricted-syntax': ['off'],
			'jsdoc/no-types': ['off'],
			'jsdoc/no-undefined-types': ['off'],
			'jsdoc/require-asterisk-prefix': ['warn'],
			'jsdoc/require-description': ['error'],
			'jsdoc/require-description-complete-sentence': ['error'],
			'jsdoc/require-example': ['off'],
			'jsdoc/require-file-overview': ['off'],
			'jsdoc/require-hyphen-before-param-description': ['warn'],
			'jsdoc/require-jsdoc': [
				'error',
				{
					require: {
						FunctionDeclaration: true,
						MethodDefinition: true,
						ClassDeclaration: true,
						ArrowFunctionExpression: true,
						FunctionExpression: true,
						ClassExpression: true
					}
				}
			],
			'jsdoc/require-param': ['error'],
			'jsdoc/require-param-description': ['error'],
			'jsdoc/require-param-name': ['error'],
			'jsdoc/require-param-type': ['error'],
			'jsdoc/require-property': ['error'],
			'jsdoc/require-property-description': ['error'],
			'jsdoc/require-property-name': ['error'],
			'jsdoc/require-property-type': ['error'],
			'jsdoc/require-returns': ['error'],
			'jsdoc/require-returns-check': ['error'],
			'jsdoc/require-returns-description': ['error'],
			'jsdoc/require-returns-type': ['error'],
			'jsdoc/require-template': ['warn'],
			'jsdoc/require-throws': ['warn'],
			'jsdoc/require-yields': ['error'],
			'jsdoc/require-yields-check': ['error'],
			'jsdoc/sort-tags': ['warn'],
			'jsdoc/tag-lines': ['error'],
			'jsdoc/valid-types': ['warn']
		},
		settings: { jsdoc: { mode: 'typescript' } }
	})),
	...compat.config({ extends: ['plugin:@nx/javascript'] }).map((config) => ({
		...config,
		files: ['**/*.js', '**/*.jsx'],
		rules: {
			...config.rules,
			'@/no-extra-semi': 'error',
			'no-extra-semi': 'off'
		}
	})),
	...compat.config({ extends: ['plugin:@nx/javascript'] }).map((config) => ({
		...config,
		files: ['**/*.config.js'],
		rules: {
			...config.rules,
			'@/no-extra-semi': 'error',
			'no-extra-semi': 'off',
			'@typescript-eslint/no-require-imports': 'off'
		}
	})),
	...compat.config({ extends: ['plugin:@nx/typescript', 'prettier'] }).map((config) => ({
		...config,
		files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx', '**/*jest.config.ts', '**/*.mock.ts'],
		rules: {
			...config.rules,
			'jsdoc/check-access': ['off'],
			'jsdoc/check-alignment': ['off'],
			'jsdoc/check-examples': ['off'],
			'jsdoc/check-indentation': ['off'],
			'jsdoc/check-line-alignment': ['off'],
			'jsdoc/check-param-names': ['off'],
			'jsdoc/check-template-names': ['off'],
			'jsdoc/check-property-names': ['off'],
			'jsdoc/check-syntax': ['off'],
			'jsdoc/check-tag-names': ['off'],
			'jsdoc/check-types': ['off'],
			'jsdoc/check-values': ['off'],
			'jsdoc/empty-tags': ['off'],
			'jsdoc/implements-on-classes': ['off'],
			'jsdoc/informative-docs': ['off'],
			'jsdoc/match-description': ['off'],
			'jsdoc/multiline-blocks': ['off'],
			'jsdoc/no-bad-blocks': ['off'],
			'jsdoc/no-blank-block-descriptions': ['off'],
			'jsdoc/no-defaults': ['off'],
			'jsdoc/no-missing-syntax': ['off'],
			'jsdoc/no-multi-asterisks': ['off'],
			'jsdoc/no-restricted-syntax': ['off'],
			'jsdoc/no-types': ['off'],
			'jsdoc/no-undefined-types': ['off'],
			'jsdoc/require-asterisk-prefix': ['off'],
			'jsdoc/require-description': ['off'],
			'jsdoc/require-description-complete-sentence': ['off'],
			'jsdoc/require-example': ['off'],
			'jsdoc/require-file-overview': ['off'],
			'jsdoc/require-hyphen-before-param-description': ['off'],
			'jsdoc/require-jsdoc': ['off'],
			'jsdoc/require-param': ['off'],
			'jsdoc/require-param-description': ['off'],
			'jsdoc/require-param-name': ['off'],
			'jsdoc/require-param-type': ['off'],
			'jsdoc/require-property': ['off'],
			'jsdoc/require-property-description': ['off'],
			'jsdoc/require-property-name': ['off'],
			'jsdoc/require-property-type': ['off'],
			'jsdoc/require-returns': ['off'],
			'jsdoc/require-returns-check': ['off'],
			'jsdoc/require-returns-description': ['off'],
			'jsdoc/require-returns-type': ['off'],
			'jsdoc/require-template': ['off'],
			'jsdoc/require-throws': ['off'],
			'jsdoc/require-yields': ['off'],
			'jsdoc/require-yields-check': ['off'],
			'jsdoc/sort-tags': ['off'],
			'jsdoc/tag-lines': ['off'],
			'jsdoc/valid-types': ['off']
		}
	})),
	...compat.config({ env: { jest: true } }).map((config) => ({
		...config,
		files: ['**/*jest.config.ts'],
		rules: {
			...config.rules,
			'@typescript-eslint/explicit-function-return-type': 'off'
		}
	})),
	{
		files: ['**/*.ts'],
		rules: {
			'@angular-eslint/prefer-standalone': 'off'
		}
	}
];
