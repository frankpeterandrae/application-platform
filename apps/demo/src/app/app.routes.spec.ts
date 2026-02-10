/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
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

	it('should have at least one route', () => {
		expect(appRoutes.length).toBeGreaterThan(0);
	});

	it('should have a default redirect route', () => {
		const defaultRoute = appRoutes.find((r) => r.path === '' && r.redirectTo);
		expect(defaultRoute).toBeDefined();
		expect(defaultRoute?.pathMatch).toBe('full');
	});

	it('should define demo route for lazy-loaded children', () => {
		const demoRoute = appRoutes.find((r) => r.path === 'demo');
		expect(demoRoute).toBeDefined();
		expect(demoRoute?.loadChildren).toBeDefined();
	});

	it('should have loadChildren functions for lazy loading', () => {
		const lazyRoutes = appRoutes.filter((r) => r.path !== '' && r.path !== '**');
		lazyRoutes.forEach((route) => {
			if (route.path && !route.redirectTo) {
				expect(typeof route.loadChildren).toBe('function');
			}
		});
	});
});
