/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { appRoutes } from './app.routes';

describe('appRoutes', () => {
	it('should define the editor as the root route', () => {
		expect(appRoutes).toHaveLength(1);

		expect(appRoutes[0].path).toBe('');
		expect(appRoutes[0].loadComponent).toBeDefined();
	});

	it('should lazy load the starmap editor', async () => {
		const loadComponent = appRoutes[0].loadComponent;

		expect(loadComponent).toBeDefined();

		const component = await loadComponent!();

		const { StarmapEditorComponent } = await import('@application-platform/starmap-editor');

		expect(component).toBe(StarmapEditorComponent);
	});
});
