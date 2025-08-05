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

	it('should export routes from module', () => {
		expect(appRoutes).toBeTruthy();
	});

	it('should define home route', () => {
		const homeRoute = appRoutes.find((r) => r.path === '');
		expect(homeRoute).toBeDefined();
	});

	it('should have lazy loaded components', () => {
		const lazyRoutes = appRoutes.filter((r) => r.loadComponent);
		expect(lazyRoutes.length).toBeGreaterThan(0);
	});

	it('should define paint-rack route', () => {
		const paintRackRoute = appRoutes.find((r) => r.path === 'paint-rack');
		expect(paintRackRoute).toBeDefined();
		expect(paintRackRoute?.loadComponent).toBeDefined();
	});

	it('should have wildcard route for 404', () => {
		const wildcardRoute = appRoutes.find((r) => r.path === '**');
		expect(wildcardRoute).toBeDefined();
		expect(wildcardRoute?.loadComponent).toBeDefined();
	});

	it('should have providers on paint-rack route', () => {
		const paintRackRoute = appRoutes.find((r) => r.path === 'paint-rack');
		expect(paintRackRoute?.providers).toBeDefined();
	});
});
