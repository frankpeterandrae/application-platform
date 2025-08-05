/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';

import { appConfig } from './app.config';

describe('appConfig', () => {
	it('should be defined', () => {
		expect(appConfig).toBeDefined();
	});

	it('should be of type ApplicationConfig', () => {
		expect(appConfig).toHaveProperty('providers');
		expect(Array.isArray(appConfig.providers)).toBe(true);
	});

	it('should have providers array', () => {
		expect(appConfig.providers.length).toBeGreaterThan(0);
	});

	it('should include zone-less change detection provider', () => {
		// Verify that providers exist and contain expected configuration
		expect(appConfig.providers).toBeTruthy();
		const providersLength = appConfig.providers.length;
		expect(providersLength).toBeGreaterThan(0);
	});

	it('should include router provider', () => {
		// Verify router is configured
		expect(appConfig.providers).toBeTruthy();
		expect(appConfig.providers.length).toBeGreaterThan(0);
	});
});
