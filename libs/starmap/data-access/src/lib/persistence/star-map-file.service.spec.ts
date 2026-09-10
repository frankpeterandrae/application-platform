/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarMap } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { StarMapFileService } from './star-map-file.service';

describe('StarMapFileService', () => {
	let service: StarMapFileService;

	const map: StarMap = {
		id: 'map',
		name: 'Test Map',
		systems: [
			{
				id: 'S001',
				name: 'Sol',
				faction: 'Imperium',
				position: {
					x: 0,
					y: 0,
					z: 0
				},
				stars: [
					{
						spectralType: 'G2'
					}
				],
				planets: [
					{
						id: 'P001',
						name: 'Terra',
						type: 'terran',
						classification: 'Hive World'
					}
				]
			}
		],
		jumpLinks: [],
		nebulae: []
	};

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(StarMapFileService);
	});

	it('should serialize a star map as version 1', () => {
		const result = JSON.parse(service.serialize(map));

		expect(result).toEqual({
			version: 1,
			map
		});
	});

	it('should deserialize a star map file', () => {
		const content = JSON.stringify({
			version: 1,
			map
		});

		expect(service.deserialize(content)).toEqual(map);
	});

	it('should preserve a star map during serialization roundtrip', () => {
		const serialized = service.serialize(map);
		const deserialized = service.deserialize(serialized);

		expect(deserialized).toEqual(map);
	});
});
