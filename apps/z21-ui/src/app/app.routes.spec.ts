/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { describe, expect, it } from 'vitest';

import { appRoutes } from './app.routes';

describe('appRoutes', () => {
	it('should be an array', () => {
		expect(Array.isArray(appRoutes)).toBe(true);
	});

	it('should be of type Route[]', () => {
		expect(appRoutes).toBeDefined();
		appRoutes.forEach((route) => {
			expect(typeof route === 'object').toBe(true);
		});
	});

	it('should export routes from module', () => {
		expect(appRoutes).toBeTruthy();
	});
});
