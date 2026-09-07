/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { JumpLinkStatus, StarMap, StarSystem } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { JumpRendererService } from './jump-renderer.service';

describe('JumpRendererService', () => {
	let service: JumpRendererService;

	const systems: StarSystem[] = [
		{
			id: 'S001',
			name: 'Alpha',
			position: {
				x: 0,
				y: 0,
				z: 0
			},
			stars: [],
			planets: []
		},
		{
			id: 'S002',
			name: 'Beta',
			position: {
				x: 3,
				y: 4,
				z: 0
			},
			stars: [],
			planets: []
		}
	];

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(JumpRendererService);
	});

	it('should render a jump link and its distance label', () => {
		const group = service.render(createMap('normal'));

		const line = group.querySelector('line');
		const label = group.querySelector('text');

		expect(group.id).toBe('jumps');
		expect(line).toBeTruthy();
		expect(label?.textContent).toBe('5');
	});

	it.each([
		['normal', '#ffffff', '5', null],
		['caution', '#ffd43b', '5', '12,8'],
		['dangerous', '#ff7a00', '7', null],
		['blocked', '#ff3b30', '6', '4,7'],
		['lost', '#0033cc', '6', '4,7']
	] as const)('should render %s jump link style', (status, stroke, strokeWidth, dash) => {
		const group = service.render(createMap(status));

		const line = group.querySelector('line');

		expect(line?.getAttribute('stroke')).toBe(stroke);

		expect(line?.getAttribute('stroke-width')).toBe(strokeWidth);

		expect(line?.getAttribute('stroke-dasharray')).toBe(dash);
	});

	it('should include z distance when calculating jump distance', () => {
		const map = createMap('normal');

		map.systems[1] = {
			...map.systems[1],
			position: {
				x: 0,
				y: 0,
				z: 6
			}
		};

		const group = service.render(map);

		expect(group.querySelector('text')?.textContent).toBe('6');
	});

	it('should skip links with a missing start system', () => {
		const map = createMap('normal');

		map.jumpLinks[0] = {
			...map.jumpLinks[0],
			startSystemId: 'missing'
		};

		const group = service.render(map);

		expect(group.querySelector('line')).toBeNull();
	});

	it('should skip links with a missing end system', () => {
		const map = createMap('normal');

		map.jumpLinks[0] = {
			...map.jumpLinks[0],
			endSystemId: 'missing'
		};

		const group = service.render(map);

		expect(group.querySelector('line')).toBeNull();
	});

	it('should skip links that connect a system to itself', () => {
		const map = createMap('normal');

		map.jumpLinks[0] = {
			...map.jumpLinks[0],
			endSystemId: 'S001'
		};

		const group = service.render(map);

		expect(group.querySelector('line')).toBeNull();
	});

	it.each([
		[
			{ x: 0, y: 0, z: 0 },
			{ x: 0, y: 4, z: 0 }
		],
		[
			{ x: 0, y: 0, z: 0 },
			{ x: 10, y: 1, z: 0 }
		],
		[
			{ x: 0, y: 5, z: 0 },
			{ x: 5, y: 0, z: 0 }
		]
	])('should position the distance label for different link orientations', (start, end) => {
		const map = createMap('normal');

		map.systems[0].position = start;
		map.systems[1].position = end;

		const group = service.render(map);

		const label = group.querySelector('text');

		expect(label).toBeTruthy();
		expect(Number(label?.getAttribute('x'))).not.toBeNaN();
		expect(Number(label?.getAttribute('y'))).not.toBeNaN();
	});

	function createMap(status: JumpLinkStatus): StarMap {
		return {
			id: 'map',
			name: 'Map',
			systems: structuredClone(systems),
			jumpLinks: [
				{
					id: 'J001',
					startSystemId: 'S001',
					endSystemId: 'S002',
					status
				}
			],
			nebulae: []
		};
	}
});
