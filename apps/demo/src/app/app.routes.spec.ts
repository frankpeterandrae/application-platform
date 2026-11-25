/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { setupTestingModule } from '../test-setup';

import { appRoutes } from './app.routes';

describe('appRoutes', () => {
	beforeEach(async () => {
		await setupTestingModule({ providers: [provideRouter(appRoutes), provideLocationMocks()] });
	});

	it('redirects the root URL to the button demo and renders it', async () => {
		const harness = await RouterTestingHarness.create('/');

		expect(TestBed.inject(Router).url).toBe('/demo/button');
		expect(harness.routeNativeElement?.querySelector('theme-button')).not.toBeNull();
	});

	it('should lazy load the paint rack demo', async () => {
		const route = appRoutes.find(({ path }) => path === 'demo/paint-rack');
		const component = await route?.loadComponent?.();

		const { ColorSearchContainerComponent } = await import('@application-platform/colour-rack');
		expect(component).toBe(ColorSearchContainerComponent);
	});
});
