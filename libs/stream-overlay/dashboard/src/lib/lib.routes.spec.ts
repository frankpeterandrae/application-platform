/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { dashboardRoutes } from './lib.routes';

describe('dashboardRoutes', () => {
	it.each([
		['paints', 'PaintSelectionComponent'],
		['paint-editor', 'PaintEditorComponent'],
		['stream-info', 'StreamInfoComponent'],
		['config', 'ConfigComponent']
	])('lazy-loads the %s Dashboard page', async (path, componentName) => {
		const route = dashboardRoutes.find((item) => item.path === path);
		const component = await route?.loadComponent?.();
		expect(typeof component === 'function' ? component.name : undefined).toBe(componentName);
	});

	it('should define dashboard routes', () => {
		expect(dashboardRoutes.map((route) => route.path)).toEqual(['', 'paints', 'paint-editor', 'stream-info', 'config']);
	});
});
