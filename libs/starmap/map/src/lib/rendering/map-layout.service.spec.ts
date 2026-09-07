/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarMap } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { MapLayoutService } from './map-layout.service';

describe('MapLayoutService', () => {
	let service: MapLayoutService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(MapLayoutService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should use minimum map bounds for an empty map', () => {
		const map: StarMap = {
			id: 'map',
			name: 'Map',
			systems: [],
			jumpLinks: [],
			nebulae: []
		};

		const renderedMap = service.getRenderedMap(map);

		expect(renderedMap.bounds).toEqual({
			minX: -10,
			maxX: 10,
			minY: -10,
			maxY: 10,
			minZ: -10,
			maxZ: 10
		});

		expect(renderedMap.width).toBe(3300);
		expect(renderedMap.height).toBe(3300);
	});

	it('should expand map bounds for systems outside the minimum range', () => {
		const map: StarMap = {
			id: 'map',
			name: 'Map',
			systems: [
				{
					id: 'S001',
					name: 'Outer',
					position: {
						x: 15,
						y: -20,
						z: 12
					},
					stars: [],
					planets: []
				}
			],
			jumpLinks: [],
			nebulae: []
		};

		const renderedMap = service.getRenderedMap(map);

		expect(renderedMap.bounds).toEqual({
			minX: -10,
			maxX: 18,
			minY: -23,
			maxY: 10,
			minZ: -10,
			maxZ: 15
		});
	});

	it('should include nebula points when calculating bounds', () => {
		const map: StarMap = {
			id: 'map',
			name: 'Map',
			systems: [],
			jumpLinks: [],
			nebulae: [
				{
					id: 'N001',
					name: 'Nebula',
					style: 'cloud',
					color: '#ffffff',
					opacity: 0.5,
					points: [
						{ x: -15, y: 0, z: 0 },
						{ x: 0, y: 18, z: 0 },
						{ x: 1, y: 1, z: 20 }
					]
				}
			]
		};

		const renderedMap = service.getRenderedMap(map);

		expect(renderedMap.bounds.minX).toBe(-18);
		expect(renderedMap.bounds.maxY).toBe(21);
		expect(renderedMap.bounds.maxZ).toBe(23);
	});

	it('should calculate the center position of a coordinate', () => {
		expect(service.getCoordinatePosition(0, -10)).toBe(1650);
		expect(service.getCoordinatePosition(-10, -10)).toBe(150);
	});

	it('should convert a 3d position to an svg position', () => {
		const position = service.getPosition(
			{
				x: 2,
				y: -3,
				z: 7
			},
			{
				minX: -10,
				maxX: 10,
				minY: -10,
				maxY: 10,
				minZ: -10,
				maxZ: 10
			}
		);

		expect(position).toEqual({
			x: 1950,
			y: 1200
		});
	});
});
