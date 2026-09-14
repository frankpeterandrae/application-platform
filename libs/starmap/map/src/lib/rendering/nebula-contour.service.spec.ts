/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { Nebula } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { NebulaContourService } from './nebula-contour.service';
import { RenderedMap } from './render-models';

describe('NebulaContourService', () => {
	let service: NebulaContourService;

	const renderedMap: RenderedMap = {
		bounds: {
			minX: -10,
			maxX: 10,
			minY: -10,
			maxY: 10,
			minZ: -10,
			maxZ: 10
		},
		width: 3300,
		height: 3300,
		xGridLines: [],
		yGridLines: []
	};

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(NebulaContourService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should return an empty path for a nebula without nodes', () => {
		const nebula: Nebula = {
			id: 'N001',
			name: 'Empty',
			style: 'cloud',
			color: '#123456',
			opacity: 0.5,
			nodes: [],
			connections: []
		};

		expect(service.createPath(nebula, renderedMap)).toBe('');
	});

	it('should create a closed contour for a single node', () => {
		const nebula: Nebula = {
			id: 'N001',
			name: 'Single',
			style: 'cloud',
			color: '#123456',
			opacity: 0.5,
			nodes: [
				{
					id: 'node-1',
					position: { x: 0, y: 0, z: 0 },
					radius: 1
				}
			],
			connections: []
		};

		const path = service.createPath(nebula, renderedMap);

		expect(path).toContain('M ');
		expect(path).toContain('L ');
		expect(path).toContain('Z');
	});

	it('should create one contour for connected nodes', () => {
		const nebula: Nebula = {
			id: 'N001',
			name: 'Connected',
			style: 'cloud',
			color: '#123456',
			opacity: 0.5,
			nodes: [
				{
					id: 'node-1',
					position: { x: -1, y: 0, z: 0 },
					radius: 1
				},
				{
					id: 'node-2',
					position: { x: 1, y: 0, z: 0 },
					radius: 1
				}
			],
			connections: [
				{
					from: 'node-1',
					to: 'node-2'
				}
			]
		};

		const path = service.createPath(nebula, renderedMap);

		expect(path).not.toBe('');
		expect(path.match(/M /g)).toHaveLength(1);
		expect(path).toContain('Z');
	});

	it('should ignore connections to unknown nodes', () => {
		const nebula: Nebula = {
			id: 'N001',
			name: 'Invalid connection',
			style: 'cloud',
			color: '#123456',
			opacity: 0.5,
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

		const path = service.createPath(nebula, renderedMap);

		expect(path).not.toBe('');
		expect(path).toContain('Z');
	});
});
