// These options were migrated by @nx/webpack:convert-to-inferred from
// the project.json file and merged with the options in this file
const configValues = {
	build: {
		default: {
			target: 'node',
			compiler: 'tsc',
			main: './src/main.ts',
			tsConfig: './tsconfig.app.json',
			assets: ['./src/assets'],
			// @nx/js:node starts main.js for inferred builds in both modes.
			outputHashing: 'none',
			outputPath: '../../dist/apps/stream-overlay-server'
		},
		development: { outputHashing: 'none' }
	}
};

// Determine the correct configValue to use based on the configuration
const configuration = process.env.NX_TASK_TARGET_CONFIGURATION || 'default';

const buildOptions = {
	...configValues.build.default,
	...configValues.build[configuration]
};
/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');

module.exports = {
	target: 'node',
	devtool: 'source-map',

	output: {
		...(process.env.NODE_ENV !== 'production' && {
			clean: true,
			devtoolModuleFilenameTemplate: '[absolute-resource-path]'
		})
	},

	plugins: [new NxAppWebpackPlugin(buildOptions)]
};
