/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StarMapStore } from '@application-platform/starmap-data-access';
import { StarMap } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../test-setup';

import { App } from './app';

describe('App', () => {
	let fixture: ComponentFixture<App>;
	let component: App;
	let store: StarMapStore;
	let httpTesting: HttpTestingController;

	const map: StarMap = {
		id: 'test-map',
		name: 'Test Map',
		systems: [],
		jumpLinks: [],
		nebulae: []
	};

	beforeEach(async () => {
		await setupTestingModule({
			imports: [App],
			providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
		});

		store = TestBed.inject(StarMapStore);
		httpTesting = TestBed.inject(HttpTestingController);

		fixture = TestBed.createComponent(App);
		component = fixture.componentInstance;

		fixture.detectChanges();
	});

	afterEach(() => {
		httpTesting.verify();
	});

	it('should create', () => {
		const request = httpTesting.expectOne('/assets/maps/starmap.json');

		request.flush(
			JSON.stringify({
				version: 1,
				map
			})
		);

		expect(component).toBeTruthy();
	});

	it('should load the initial map', async () => {
		const request = httpTesting.expectOne('/assets/maps/starmap.json');

		expect(request.request.method).toBe('GET');
		expect(request.request.responseType).toBe('text');

		request.flush(
			JSON.stringify({
				version: 1,
				map
			})
		);

		await fixture.whenStable();

		expect(store.map()).toEqual(map);
	});

	it('should render the router outlet', () => {
		const request = httpTesting.expectOne('/assets/maps/starmap.json');

		request.flush(
			JSON.stringify({
				version: 1,
				map
			})
		);

		const outlet = fixture.nativeElement.querySelector('router-outlet');

		expect(outlet).toBeTruthy();
	});
});
