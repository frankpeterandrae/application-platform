/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { defineConfig, devices } from '@playwright/test';

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://127.0.0.1:4210';

const config = defineConfig({
	timeout: 30_000, // pro Test
	globalTimeout: 10 * 60_000, // gesamter Run (CI)
	workers: process.env['CI'] ? 2 : undefined,
	retries: process.env['CI'] ? 1 : 0,

	// WICHTIG: verhindert "hängt nach Erfolg"
	forbidOnly: !!process.env['CI'],
	reporter: process.env['CI'] ? [['list']] : 'html',
	testDir: './src',
	use: {
		baseURL,
		trace: process.env['CI'] ? 'on-first-retry' : 'on'
	},
	webServer: {
		command: 'npx nx run z21-ui:serve:development --port=4210 --host=127.0.0.1',
		url: baseURL,
		reuseExistingServer: false,
		timeout: 120_000,
		stdout: 'pipe',
		stderr: 'pipe'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},

		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},

		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		}
	]
});

module.exports = config;
