/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarMap, StarSystem } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { SystemRendererService } from './system-renderer.service';

describe('SystemRendererService', () => {
	let service: SystemRendererService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(SystemRendererService);
	});

	it('should calculate the rendered position and labels', () => {
		const system = createSystem('S001', 'Alpha', 0, 0);

		const map = createMap([system]);

		const rendered = service.getRenderedSystem(system, map);

		expect(rendered.position).toEqual({
			x: 1650,
			y: 1650
		});

		expect(rendered.labelPosition).toEqual({
			x: 1675,
			y: 1625
		});

		expect(rendered.zPosition).toEqual({
			x: 20,
			y: 30
		});
	});

	it('should offset systems sharing the same position', () => {
		const first = createSystem('S001', 'Alpha', 0, 0);

		const second = createSystem('S002', 'Beta', 0, 0);

		const map = createMap([first, second]);

		expect(service.getRenderedSystem(first, map).position).toEqual({
			x: 1650,
			y: 1650
		});

		expect(service.getRenderedSystem(second, map).position).toEqual({
			x: 1620,
			y: 1680
		});
	});

	it('should render accessible star system groups', () => {
		const system = createSystem('S001', 'Alpha', 0, 0);

		const group = service.renderSystems(createMap([system]));

		const systemGroup = group.querySelector('.star-system');

		expect(group.id).toBe('systems');

		expect(systemGroup?.getAttribute('data-system-id')).toBe('S001');

		expect(systemGroup?.getAttribute('tabindex')).toBe('0');

		expect(systemGroup?.getAttribute('role')).toBe('button');

		expect(systemGroup?.getAttribute('aria-label')).toBe('Alpha');
	});

	it('should render a positive z coordinate with a plus sign', () => {
		const system = {
			...createSystem('S001', 'Alpha', 0, 0),
			position: {
				x: 0,
				y: 0,
				z: 3
			}
		};

		const group = service.renderSystems(createMap([system]));

		expect(group.querySelector('text')?.textContent).toBe('+3');
	});

	it('should render a negative z coordinate without an extra sign', () => {
		const system = {
			...createSystem('S001', 'Alpha', 0, 0),
			position: {
				x: 0,
				y: 0,
				z: -2
			}
		};

		const group = service.renderSystems(createMap([system]));

		expect(group.querySelector('text')?.textContent).toBe('-2');
	});

	it('should render system names', () => {
		const systems = [createSystem('S001', 'Alpha', 0, 0), createSystem('S002', 'Beta', 2, 3)];

		const group = service.renderNames(createMap(systems));

		expect(group.id).toBe('names');

		expect(Array.from(group.querySelectorAll('text')).map((label) => label.textContent)).toEqual(['Alpha', 'Beta']);
	});

	it('should tweak the position for multi-star systems', () => {
		const system = createSystem('S001', 'Alpha', 0, 0, ['G2', 'M5']);

		const rendered = service.getRenderedSystem(system, createMap([system]));

		expect(rendered.starOffset).not.toEqual({
			x: 0,
			y: 0
		});
	});

	it.each([
		[['G2', 'M5'], { x: 12, y: 12 }],
		[['G2', 'K2', 'M5'], { x: 0, y: 18 }],
		[['G2', 'K2', 'F2', 'M5'], { x: 0, y: 18 }],
		[['G2', 'K2', 'M5', 'M6'], { x: 9, y: 9 }],
		[['G2', 'K2', 'F2', 'M5', 'M6'], { x: 0, y: 10 }],
		[['G2', 'M5', 'M6', 'M7', 'M8', 'M9'], { x: 7, y: 12 }],
		[['G2', 'K2', 'M5', 'M6', 'M7', 'M8'], { x: 0, y: 12 }],
		[['G2', 'K2', 'F2', 'M5', 'M6', 'M7'], { x: -14, y: 12 }],
		[['G2', 'K2', 'F2', 'A2', 'M5', 'M6'], { x: -14, y: 0 }],
		[['G2', 'K2', 'M5', 'M6', 'M7', 'M8', 'M9', 'M9'], { x: 10.5, y: 10.5 }],
		[['G2', 'K2', 'F2', 'M5', 'M6', 'M7', 'M8', 'M9'], { x: -21, y: 10.5 }],
		[['G2', 'K2', 'F2', 'A2', 'B2', 'O2', 'M8', 'M9'], { x: 10.5, y: 0 }]
	] as const)('should calculate star tweak for %j', (spectralTypes, expected) => {
		const system = createSystem('S001', 'Alpha', 0, 0, [...spectralTypes]);

		const rendered = service.getRenderedSystem(system, createMap([system]));

		expect(rendered.starOffset).toEqual(expected);
	});

	it('should use the default duplicate offset when more than five systems share a position', () => {
		const systems = Array.from({ length: 6 }, (_, index) => createSystem(`S00${index + 1}`, `System ${index + 1}`, 0, 0));

		const rendered = service.getRenderedSystem(systems[5], createMap(systems));

		expect(rendered.position).toEqual({
			x: 1650,
			y: 1650
		});
	});

	function createSystem(id: string, name: string, x: number, y: number, spectralTypes: string[] = ['G2']): StarSystem {
		return {
			id,
			name,
			position: {
				x,
				y,
				z: 0
			},
			stars: spectralTypes.map((spectralType) => ({
				spectralType
			})),
			planets: []
		};
	}

	function createMap(systems: StarSystem[]): StarMap {
		return {
			id: 'map',
			name: 'Map',
			systems,
			jumpLinks: [],
			nebulae: []
		};
	}
});
