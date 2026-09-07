/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarMap } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { NebulaRendererService } from './nebula-renderer.service';

describe('NebulaRendererService', () => {
	let service: NebulaRendererService;

	const renderedMap = {
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

		service = TestBed.inject(NebulaRendererService);
	});

	it.each([
		['cloud', 'fill', '#123456'],
		['outline', 'fill', 'none'],
		['haze', 'fill', '#123456']
	] as const)('should render %s nebulae', (style, attribute, expected) => {
		const map: StarMap = {
			id: 'map',
			name: 'Map',
			systems: [],
			jumpLinks: [],
			nebulae: [
				{
					id: 'N001',
					name: 'Test',
					style,
					color: '#123456',
					opacity: 0.5,
					points: [
						{ x: 0, y: 0, z: 0 },
						{ x: 2, y: 0, z: 0 },
						{ x: 1, y: 2, z: 0 }
					]
				}
			]
		};

		const group = service.render(map, renderedMap);

		const path = group.querySelector('path');

		expect(path).toBeTruthy();
		expect(path?.getAttribute(attribute)).toBe(expected);
		expect(path?.getAttribute('d')).toContain('C ');
		expect(path?.getAttribute('d')).toContain('Z');
	});

	it('should skip nebulae with less than three points', () => {
		const map: StarMap = {
			id: 'map',
			name: 'Map',
			systems: [],
			jumpLinks: [],
			nebulae: [
				{
					id: 'N001',
					name: 'Invalid',
					style: 'cloud',
					color: '#ffffff',
					opacity: 0.5,
					points: [
						{ x: 0, y: 0, z: 0 },
						{ x: 1, y: 1, z: 0 }
					]
				}
			]
		};

		const group = service.render(map, renderedMap);

		expect(group.querySelector('path')).toBeNull();
	});
});
