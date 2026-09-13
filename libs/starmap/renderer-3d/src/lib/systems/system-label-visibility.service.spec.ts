/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarSystem } from '@application-platform/starmap-domain';
import { Vector3 } from 'three';

import { setupTestingModule } from '../../test-setup';
import { Starmap3dPositionService } from '../util/starmap-3d-position.service';

import { SystemLabelVisibilityService } from './system-label-visibility.service';

describe('SystemLabelVisibilityService', () => {
	let service: SystemLabelVisibilityService;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [SystemLabelVisibilityService, Starmap3dPositionService]
		});

		service = TestBed.inject(SystemLabelVisibilityService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should return the nearest systems up to the maximum label count', () => {
		const systems: StarSystem[] = [
			createSystem('S001', 1, 0, 0),
			createSystem('S002', 4, 0, 0),
			createSystem('S003', 2, 0, 0),
			createSystem('S004', 3, 0, 0)
		];

		const visibleSystemIds = service.getVisibleSystemIds(systems, new Vector3(), 2);

		expect([...visibleSystemIds]).toEqual(['S001', 'S003']);
	});

	it('should return all systems when the maximum label count exceeds the system count', () => {
		const systems: StarSystem[] = [createSystem('S001', 1, 0, 0), createSystem('S002', 2, 0, 0)];

		const visibleSystemIds = service.getVisibleSystemIds(systems, new Vector3(), 10);

		expect(visibleSystemIds).toEqual(new Set(['S001', 'S002']));
	});

	it('should calculate distance relative to the camera position', () => {
		const systems: StarSystem[] = [createSystem('S001', 0, 0, 0), createSystem('S002', 10, 0, 0)];

		const cameraPosition = new Vector3(30, 0, 0);

		const visibleSystemIds = service.getVisibleSystemIds(systems, cameraPosition, 1);

		expect(visibleSystemIds).toEqual(new Set(['S002']));
	});

	it('should return no systems when the maximum label count is zero', () => {
		const systems: StarSystem[] = [createSystem('S001', 1, 0, 0)];

		const visibleSystemIds = service.getVisibleSystemIds(systems, new Vector3(), 0);

		expect(visibleSystemIds.size).toBe(0);
	});

	it('should return an empty set when no systems are provided', () => {
		const visibleSystemIds = service.getVisibleSystemIds([], new Vector3());

		expect(visibleSystemIds.size).toBe(0);
	});

	function createSystem(id: string, x: number, y: number, z: number): StarSystem {
		return {
			id,
			name: id,
			position: {
				x,
				y,
				z
			},
			stars: [],
			planets: []
		};
	}
});
