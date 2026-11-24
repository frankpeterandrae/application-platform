/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { overlayRoutes } from './lib.routes';

describe('overlayRoutes', () => {
	it('should expose only lazy widget routes', () => {
		expect(overlayRoutes.map(({ path }) => path)).toEqual(['header', 'current-paint', 'webcam-frame', 'scene-frame']);
		for (const route of overlayRoutes) {
			expect(route.loadComponent).toBeTypeOf('function');
			expect(route.component).toBeUndefined();
		}
	});
});
