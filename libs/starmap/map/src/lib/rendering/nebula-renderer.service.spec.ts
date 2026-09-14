/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { NebulaType, StarMap } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { NebulaRendererService } from './nebula-renderer.service';
import { RenderedMap } from './render-models';

describe('NebulaRendererService', () => {
	let service: NebulaRendererService;

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

		service = TestBed.inject(NebulaRendererService);
	});

	function createMap(style: NebulaType): StarMap {
		return {
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
					nodes: [
						{
							id: 'node-1',
							position: { x: 0, y: 0, z: 0 },
							radius: 1
						}
					],
					connections: []
				}
			]
		};
	}

	it('should render cloud nebulae', () => {
		const group = service.render(createMap('cloud'), renderedMap);

		const path = group.querySelector('path');

		expect(path).toBeTruthy();
		expect(path?.getAttribute('fill')).toBe('#123456');
		expect(path?.getAttribute('fill-opacity')).toBe('0.5');
		expect(path?.getAttribute('stroke')).toBe('none');
	});

	it('should render haze nebulae', () => {
		const group = service.render(createMap('haze'), renderedMap);

		const path = group.querySelector('path');

		expect(path).toBeTruthy();
		expect(path?.getAttribute('fill')).toBe('#123456');
		expect(path?.getAttribute('fill-opacity')).toBe('0.275');
		expect(path?.getAttribute('stroke')).toBe('#123456');
		expect(path?.getAttribute('stroke-opacity')).toBe('0.175');
		expect(path?.getAttribute('stroke-width')).toBe('18');
	});

	it('should render outline nebulae', () => {
		const group = service.render(createMap('outline'), renderedMap);

		const path = group.querySelector('path');

		expect(path).toBeTruthy();
		expect(path?.getAttribute('fill')).toBe('none');
		expect(path?.getAttribute('stroke')).toBe('#123456');
		expect(path?.getAttribute('stroke-opacity')).toBe('0.5');
		expect(path?.getAttribute('stroke-width')).toBe('6');
	});

	it('should render the nebula name on its group', () => {
		const group = service.render(createMap('cloud'), renderedMap);

		const nebulaGroup = group.querySelector('[data-nebula-name]');

		expect(nebulaGroup?.getAttribute('data-nebula-name')).toBe('Test');
	});

	it('should not render a path for a nebula without nodes', () => {
		const map = createMap('cloud');

		map.nebulae[0].nodes = [];

		const group = service.render(map, renderedMap);

		expect(group.querySelector('path')).toBeNull();
	});
});
