/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { Nebula } from '@application-platform/starmap-domain';
import { MeshBasicMaterial } from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

import { setupTestingModule } from '../../test-setup';

import { NebulaMetaballService } from './nebula-metaball.service';

describe('NebulaMetaballService', () => {
	let service: NebulaMetaballService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(NebulaMetaballService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should return null for a nebula without nodes', () => {
		const nebula: Nebula = {
			id: 'N001',
			name: 'Empty',
			style: 'cloud',
			color: '#ffffff',
			opacity: 1,
			nodes: [],
			connections: []
		};

		const material = new MeshBasicMaterial();

		expect(service.create(nebula, material)).toBeNull();

		material.dispose();
	});

	it('should create marching cubes for a nebula node', () => {
		const nebula: Nebula = {
			id: 'N001',
			name: 'Nebula',
			style: 'cloud',
			color: '#ffffff',
			opacity: 1,
			nodes: [
				{
					id: 'node-1',
					position: {
						x: 2,
						y: -3,
						z: 4
					},
					radius: 1
				}
			],
			connections: []
		};

		const material = new MeshBasicMaterial();

		const mesh = service.create(nebula, material);

		expect(mesh).toBeInstanceOf(MarchingCubes);
		expect(mesh?.position.x).toBeCloseTo(6);
		expect(mesh?.position.y).toBeCloseTo(9);
		expect(mesh?.position.z).toBeCloseTo(12);

		mesh?.geometry.dispose();
		material.dispose();
	});

	it('should ignore connections with missing nodes', () => {
		const nebula: Nebula = {
			id: 'N001',
			name: 'Nebula',
			style: 'cloud',
			color: '#ffffff',
			opacity: 1,
			nodes: [
				{
					id: 'node-1',
					position: { x: 0, y: 0, z: 0 },
					radius: 1
				}
			],
			connections: [
				{
					from: 'node-1',
					to: 'missing'
				}
			]
		};

		const material = new MeshBasicMaterial();

		expect(service.create(nebula, material)).toBeInstanceOf(MarchingCubes);

		material.dispose();
	});
});
