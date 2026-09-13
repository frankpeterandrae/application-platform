/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';
import { STARMAP_3D_SCALE } from '../rendering/starmap-3d-scale';

import { Starmap3dPositionService } from './starmap-3d-position.service';

describe('Starmap3dPositionService', () => {
	let service: Starmap3dPositionService;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [Starmap3dPositionService]
		});

		service = TestBed.inject(Starmap3dPositionService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should convert a starmap position to a scaled Three.js position', () => {
		const result = service.toVector3({
			x: 2,
			y: 3,
			z: 4
		});

		expect(result.toArray()).toEqual([
			2 * STARMAP_3D_SCALE.systemDistance,
			-3 * STARMAP_3D_SCALE.systemDistance,
			4 * STARMAP_3D_SCALE.systemDistance
		]);
	});

	it('should invert the y axis', () => {
		const result = service.toVector3({
			x: 0,
			y: -5,
			z: 0
		});

		expect(result.y).toBe(5 * STARMAP_3D_SCALE.systemDistance);
	});

	it('should preserve the origin', () => {
		const result = service.toVector3({
			x: 0,
			y: 0,
			z: 0
		});

		expect(result.toArray()).toEqual([0, -0, 0]);
	});
});
