/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { appRoutes } from './app.routes';

describe('appRoutes', () => {
	it('should define dashboard route', () => {
		expect(appRoutes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: 'dashboard',
					loadChildren: expect.any(Function)
				})
			])
		);
	});

	it('should define overlay route', () => {
		expect(appRoutes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					path: 'overlay',
					loadChildren: expect.any(Function)
				})
			])
		);
	});

	it('should redirect root route to dashboard', () => {
		expect(appRoutes).toEqual(
			expect.arrayContaining([
				{
					path: '',
					pathMatch: 'full',
					redirectTo: 'dashboard'
				}
			])
		);
	});
});
