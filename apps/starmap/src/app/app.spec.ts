/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { STAR_MAP_WORKSPACE, StarMapStore, StarMapWorkspace } from '@application-platform/starmap-data-access';
import { StarMap } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../test-setup';

import { App } from './app';
import { StarMapAutosaveService } from './persistence/star-map-autosave.service';

describe('App', () => {
	let fixture: ComponentFixture<App>;
	let component: App;
	let store: StarMapStore;
	let httpTesting: HttpTestingController;

	const workspace: StarMapWorkspace = {
		load: vi.fn(),
		save: vi.fn()
	};

	const map: StarMap = {
		id: 'test-map',
		name: 'Test Map',
		systems: [],
		jumpLinks: [],
		nebulae: []
	};

	const autosaveService = {
		start: vi.fn()
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		vi.mocked(workspace.load).mockResolvedValue(
			JSON.stringify({
				version: 1,
				map
			})
		);

		await setupTestingModule({
			imports: [App],
			providers: [
				provideRouter([]),
				{
					provide: STAR_MAP_WORKSPACE,
					useValue: workspace
				},
				{
					provide: StarMapAutosaveService,
					useValue: autosaveService
				}
			]
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
		expect(component).toBeTruthy();
	});

	it('should load the initial map', async () => {
		await fixture.whenStable();

		expect(workspace.load).toHaveBeenCalledOnce();
		expect(store.map()).toEqual(map);
		expect(autosaveService.start).toHaveBeenCalledOnce();
	});

	it('should render the router outlet', () => {
		const outlet = fixture.nativeElement.querySelector('router-outlet');

		expect(outlet).toBeTruthy();
	});
});
