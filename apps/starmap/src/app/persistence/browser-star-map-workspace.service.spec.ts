/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { BrowserStarMapWorkspaceService } from './browser-star-map-workspace.service';

describe('BrowserStarMapWorkspaceService', () => {
	let service: BrowserStarMapWorkspaceService;
	let httpTesting: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [BrowserStarMapWorkspaceService, provideHttpClient(), provideHttpClientTesting()]
		});

		service = TestBed.inject(BrowserStarMapWorkspaceService);
		httpTesting = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpTesting.verify();
	});

	it('should load the default map asset', async () => {
		const result = service.load();

		const request = httpTesting.expectOne('/assets/maps/starmap.json');

		expect(request.request.method).toBe('GET');
		expect(request.request.responseType).toBe('text');

		request.flush('map-content');

		await expect(result).resolves.toBe('map-content');
	});

	it('should not persist workspace changes in the browser', async () => {
		await expect(service.save('map-content')).resolves.toBeUndefined();

		httpTesting.expectNone('/assets/maps/starmap.json');
	});
});
