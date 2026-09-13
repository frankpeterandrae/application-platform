/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarSystem } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { CameraService } from './camera.service';

describe('CameraService', () => {
	let service: CameraService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(CameraService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should initialize the camera position', () => {
		expect(service.getCamera().position.z).toBe(10);
	});

	it('should update the camera aspect ratio', () => {
		service.resize(800, 600);

		expect(service.getCamera().aspect).toBe(800 / 600);
	});

	it('should not fit the camera when no systems exist', () => {
		const result = service.fitToSystems([]);

		expect(result).toBeNull();
	});

	it('should center the camera on the systems', () => {
		const systems: StarSystem[] = [
			{
				id: 'S001',
				name: 'A',
				position: { x: -10, y: -20, z: -5 },
				stars: [],
				planets: []
			},
			{
				id: 'S002',
				name: 'B',
				position: { x: 10, y: 20, z: 5 },
				stars: [],
				planets: []
			}
		];

		const target = service.fitToSystems(systems);

		expect(target).toEqual({
			x: 0,
			y: 0,
			z: 0
		});
	});

	it('should position the camera far enough from the systems', () => {
		const systems: StarSystem[] = [
			{
				id: 'S001',
				name: 'A',
				position: { x: -10, y: 0, z: 0 },
				stars: [],
				planets: []
			},
			{
				id: 'S002',
				name: 'B',
				position: { x: 10, y: 0, z: 0 },
				stars: [],
				planets: []
			}
		];

		service.fitToSystems(systems);

		expect(service.getCamera().position.z).toBeGreaterThan(10);
	});
});
