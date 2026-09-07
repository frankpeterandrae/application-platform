/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StarMapStore } from '@application-platform/starmap-data-access';

import { setupTestingModule } from '../test-setup';

import { App } from './app';

describe('App', () => {
	let fixture: ComponentFixture<App>;
	let component: App;
	let store: StarMapStore;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [App],
			providers: [provideRouter([])]
		});

		store = TestBed.inject(StarMapStore);

		fixture = TestBed.createComponent(App);

		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should initialize the demo map', () => {
		expect(store.map()).toEqual({
			id: 'demo-map',
			name: 'Testsektor',
			systems: [
				{
					id: 'sol',
					name: 'Sol',
					faction: 'Imperium',
					position: {
						x: 10,
						y: 10,
						z: 0
					},
					stars: [
						{
							spectralType: 'G2'
						}
					],
					planets: []
				}
			],
			jumpLinks: [],
			nebulae: []
		});
	});

	it('should render the router outlet', () => {
		const outlet = fixture.nativeElement.querySelector('router-outlet');

		expect(outlet).toBeTruthy();
	});
});
