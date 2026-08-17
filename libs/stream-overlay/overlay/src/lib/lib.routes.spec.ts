/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { overlayRoutes } from './lib.routes';
import { OverlayWrapperComponent } from './overlay/components/overlay-wrapper/overlay-wrapper.component';

describe('overlayRoutes', () => {
	it('should expose overlay component at root route', () => {
		expect(overlayRoutes).toEqual([
			{
				path: '',
				component: OverlayWrapperComponent
			}
		]);
	});
});
