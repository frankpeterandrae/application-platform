/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { setupTestingModule } from '../test-setup';

import { appRoutes } from './app.routes';

describe('appRoutes', () => {
	beforeEach(async () => {
		await setupTestingModule({ providers: [provideRouter(appRoutes), provideLocationMocks()] });
	});

	it.each([
		['/', 'homepage-feature-home'],
		['/paint-rack', 'cr-color-search-container'],
		['/unknown-page', 'homepage-feature-error404']
	])('renders the page for %s', async (url, selector) => {
		const harness = await RouterTestingHarness.create(url);

		expect(harness.routeNativeElement?.matches(selector)).toBe(true);
	});
});
