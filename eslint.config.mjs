/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

// eslint.config.mjs
import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
	...nx.configs['flat/base'],
	...nx.configs['flat/typescript'],
	...nx.configs['flat/javascript'],

	{
		ignores: [
			'**/dist',
			'**/out-tsc',
			'**/coverage',
			'**/release',
			'**/.nx',
			'**/.angular',
			'**/jest.config.ts',
			'**/vitest.config.*.timestamp*',
			'**/tools/**',
			'vitest.workspace.*',
			'./vitest.workspace.*',
			'scripts/**'
		]
	},

	// -----------------------------
	// Nx module boundaries
	// -----------------------------
	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		rules: {
			'@nx/enforce-module-boundaries': [
				'error',
				{
					// libs müssen nicht zwingend buildable sein -> weniger Schmerz im Merge
					enforceBuildableLibDependency: false,

					// eslint config files dürfen importiert werden
					allow: ['^.*/eslint\\.config\\.[cm]?[jt]s$'],

					depConstraints: [
						// -------------------------
						// Platform barriers
						// -------------------------
						{
							sourceTag: 'platform:browser',
							onlyDependOnLibsWithTags: ['platform:browser', 'platform:agnostic']
						},
						{
							sourceTag: 'platform:node',
							onlyDependOnLibsWithTags: ['platform:node', 'platform:agnostic']
						},

						// -------------------------
						// Scope barriers (pro Thema)
						// -------------------------
						{
							sourceTag: 'scope:z21',
							onlyDependOnLibsWithTags: ['scope:z21', 'scope:shared']
						},
						{
							sourceTag: 'scope:homepage',
							onlyDependOnLibsWithTags: ['scope:homepage', 'scope:shared']
						},
						{
							sourceTag: 'scope:demo',
							onlyDependOnLibsWithTags: ['scope:demo', 'scope:shared']
						},
						{
							sourceTag: 'scope:shared',
							onlyDependOnLibsWithTags: ['scope:shared']
						},

						// -------------------------
						// Type / Layering
						// -------------------------
						{
							sourceTag: 'type:app',
							onlyDependOnLibsWithTags: [
								'type:feature',
								'type:ui',
								'type:data-access',
								'type:domain',
								'type:protocol',
								'type:shared',
								'type:util',
								'type:server',
								'type:server-utils',
								'type:integration',
								'type:testing'
							]
						},
						{
							sourceTag: 'type:feature',
							onlyDependOnLibsWithTags: [
								'type:feature',
								'type:ui',
								'type:data-access',
								'type:domain',
								'type:protocol',
								'type:shared',
								'type:util',
								'type:testing'
							]
						},
						{
							sourceTag: 'type:ui',
							onlyDependOnLibsWithTags: [
								'type:ui',
								'type:domain',
								'type:protocol',
								'type:shared',
								'type:util',
								'type:testing'
							]
						},
						{
							sourceTag: 'type:data-access',
							onlyDependOnLibsWithTags: [
								'type:data-access',
								'type:domain',
								'type:protocol',
								'type:shared',
								'type:util',
								'type:testing'
							]
						},

						// server side
						{
							sourceTag: 'type:server',
							onlyDependOnLibsWithTags: [
								'type:server',
								'type:server-utils',
								'type:integration',
								'type:domain',
								'type:protocol',
								'type:shared',
								'type:util',
								'type:testing'
							]
						},
						{
							sourceTag: 'type:server-utils',
							onlyDependOnLibsWithTags: [
								'type:server-utils',
								'type:integration',
								'type:domain',
								'type:protocol',
								'type:shared',
								'type:util',
								'type:testing'
							]
						},
						{
							sourceTag: 'type:integration',
							onlyDependOnLibsWithTags: [
								'type:integration',
								'type:domain',
								'type:protocol',
								'type:shared',
								'type:util',
								'type:testing'
							]
						},

						// keep core clean
						{
							sourceTag: 'type:domain',
							onlyDependOnLibsWithTags: ['type:domain', 'type:shared', 'type:util', 'type:testing']
						},
						{
							sourceTag: 'type:protocol',
							onlyDependOnLibsWithTags: ['type:protocol', 'type:shared', 'type:util', 'type:testing']
						},
						{
							sourceTag: 'type:shared',
							onlyDependOnLibsWithTags: ['type:shared', 'type:util', 'type:testing']
						},
						{
							sourceTag: 'type:util',
							onlyDependOnLibsWithTags: ['type:util', 'type:testing']
						},

						// tests
						{
							sourceTag: 'type:testing',
							onlyDependOnLibsWithTags: ['type:testing', 'type:util', 'type:shared', 'type:domain', 'type:protocol']
						},
						{
							sourceTag: 'type:e2e',
							onlyDependOnLibsWithTags: [
								'type:e2e',
								'type:app',
								'type:server',
								'type:ui',
								'type:protocol',
								'type:shared',
								'type:testing',
								'type:util'
							]
						}
					]
				}
			]
		}
	},

	// -----------------------------
	// workspace helper files: no special parser override — allow TS project service to include them
	// (vitest.workspace.ts is included in tsconfig.tools.json so the project service will find it)
	// -----------------------------

	// -----------------------------
	// Ensure vitest.workspace.ts is parsed with the tools tsconfig (use absolute paths)
	{
		files: ['vitest.workspace.ts', './vitest.workspace.ts', 'D:/dev/src/application-platform/vitest.workspace.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: 'D:/dev/src/application-platform',
				project: ['D:/dev/src/application-platform/tsconfig.tools.json'],
				allowDefaultProject: ['D:/dev/src/application-platform/vitest.workspace.ts'],
				createDefaultProgram: true
			}
		}
	},

	// -----------------------------
	// Shared TS rules (non-type-aware, fast)
	{
		files: ['**/*.ts', '!**/vitest.workspace.ts', '!**/vite*.workspace.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				project: ['./tsconfig.tools.json'],
				allowDefaultProject: [
					'tools/jest/angular-jest.base.ts',
					'./vitest.workspace.ts',
					'D:/dev/src/application-platform/vitest.workspace.ts'
				]
			}
		},
		plugins: {
			import: importPlugin,
			'unused-imports': unusedImports,
			jsdoc
		},
		rules: {
			// imports
			'unused-imports/no-unused-imports': 'error',
			'@typescript-eslint/no-unused-vars': 'off',

			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',

			// keep it readable and avoid Nx pain
			'import/no-cycle': ['error', { maxDepth: 1 }],
			'import/order': [
				'warn',
				{
					'newlines-between': 'always',
					alphabetize: { order: 'asc', caseInsensitive: true }
				}
			],

			// docs only for public/exported APIs (not every private helper)
			'jsdoc/require-jsdoc': [
				'error',
				{
					require: { FunctionDeclaration: true, ClassDeclaration: true, MethodDefinition: true },
					contexts: [
						'ExportNamedDeclaration > FunctionDeclaration',
						'ExportNamedDeclaration > ClassDeclaration',
						'ExportDefaultDeclaration > FunctionDeclaration',
						'ExportDefaultDeclaration > ClassDeclaration',
						"MethodDefinition[accessibility='public']"
					]
				}
			],

			eqeqeq: 'error',
			'no-debugger': 'error',
			'no-console': 'error'
		}
	},

	// tests: weniger streng
	{
		files: ['**/*.spec.ts', '**/*.test.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'jsdoc/require-jsdoc': 'off',
			'no-console': 'off',
			'@typescript-eslint/no-unnecessary-condition': 'off'
		}
	},

	// -----------------------------
	// Type-aware rules (nur server + libs; UI Apps bleiben schnell)
	// -----------------------------
	...tseslint.config({
		files: ['apps/**/*.ts', 'libs/**/*.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				project: ['./tsconfig.tools.json'],
				allowDefaultProject: ['tools/jest/angular-jest.base.ts', './vitest.workspace.ts']
			}
		},
		rules: {
			'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/await-thenable': 'error',

			// sehr gut für eure Protocol/Message unions
			'@typescript-eslint/switch-exhaustiveness-check': 'error',

			'@typescript-eslint/no-unnecessary-condition': 'error'
		}
	}),

	// Prettier last
	prettier
];
