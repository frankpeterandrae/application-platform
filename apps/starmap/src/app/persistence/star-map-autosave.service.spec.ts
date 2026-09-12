/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { STAR_MAP_WORKSPACE, StarMapFileService, StarMapStore, StarMapWorkspace } from '@application-platform/starmap-data-access';
import { StarMap } from '@application-platform/starmap-domain';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StarMapAutosaveService } from './star-map-autosave.service';

describe('StarMapAutosaveService', () => {
	let service: StarMapAutosaveService;
	let store: StarMapStore;
	let starMapFileService: StarMapFileService;

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

	beforeEach(() => {
		vi.useFakeTimers();

		TestBed.configureTestingModule({
			providers: [
				StarMapAutosaveService,
				{
					provide: STAR_MAP_WORKSPACE,
					useValue: workspace
				}
			]
		});

		service = TestBed.inject(StarMapAutosaveService);
		store = TestBed.inject(StarMapStore);
		starMapFileService = TestBed.inject(StarMapFileService);

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should not save the initial map', async () => {
		store.setMap(map);

		service.start();

		TestBed.tick();

		await vi.advanceTimersByTimeAsync(500);

		expect(workspace.save).not.toHaveBeenCalled();
	});

	it('should save a changed map after the debounce', async () => {
		store.setMap(map);

		service.start();

		TestBed.tick();

		store.setMap({
			...map,
			name: 'Changed Map'
		});

		await vi.advanceTimersByTimeAsync(500);

		expect(workspace.save).toHaveBeenCalledOnce();
	});

	it('should debounce multiple map changes', async () => {
		store.setMap(map);

		service.start();

		TestBed.tick();

		store.setMap({
			...map,
			name: 'Change 1'
		});

		await vi.advanceTimersByTimeAsync(200);

		store.setMap({
			...map,
			name: 'Change 2'
		});

		await vi.advanceTimersByTimeAsync(200);

		store.setMap({
			...map,
			name: 'Change 3'
		});

		await vi.advanceTimersByTimeAsync(500);

		expect(workspace.save).toHaveBeenCalledOnce();
	});

	it('should serialize the changed map before saving', async () => {
		const changedMap: StarMap = {
			...map,
			name: 'Changed Map'
		};

		const serializeSpy = vi.spyOn(starMapFileService, 'serialize').mockReturnValue('serialized-content');

		store.setMap(map);

		service.start();

		TestBed.tick();

		store.setMap(changedMap);

		await vi.advanceTimersByTimeAsync(500);

		expect(serializeSpy).toHaveBeenCalledWith(changedMap);
		expect(workspace.save).toHaveBeenCalledWith('serialized-content');
	});
});
