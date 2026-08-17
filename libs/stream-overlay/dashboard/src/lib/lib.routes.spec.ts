/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { dashboardRoutes } from './lib.routes';

describe('dashboardRoutes', () => {
	it('should define dashboard routes', () => {
		expect(dashboardRoutes.map((route) => route.path)).toEqual(['', 'paints', 'paint-editor', 'stream-info']);
	});
});
