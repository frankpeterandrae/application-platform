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

	plugins: [
		new NxAppWebpackPlugin({
			target: 'node',
			compiler: 'tsc',
			main: './src/main.ts',
			tsConfig: './tsconfig.app.json',
			assets: ['./src/assets']
		})
	]
};
