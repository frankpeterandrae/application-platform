/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { JumpLink, Nebula, StarMap, StarSystem } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { StarMapStore } from './star-map.store';

describe('StarMapStore', () => {
	let store: StarMapStore;

	const sol: StarSystem = {
		id: 'S001',
		name: 'Sol',
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
		planets: []
	};

	const alpha: StarSystem = {
		id: 'S002',
		name: 'Alpha',
		position: {
			x: 5,
			y: 2,
			z: 1
		},
		stars: [
			{
				spectralType: 'K5'
			}
		],
		planets: []
	};

	const jumpLink: JumpLink = {
		id: 'J001',
		startSystemId: 'S001',
		endSystemId: 'S002',
		status: 'normal'
	};

	const nebula: Nebula = {
		id: 'N001',
		name: 'Test Nebula',
		style: 'cloud',
		color: '#7a2f8f',
		opacity: 0.35,
		points: [
			{ x: 0, y: 0, z: 0 },
			{ x: 1, y: 0, z: 0 },
			{ x: 0, y: 1, z: 0 }
		]
	};

	const map: StarMap = {
		id: 'map',
		name: 'Test Map',
		systems: [sol, alpha],
		jumpLinks: [jumpLink],
		nebulae: [nebula]
	};

	beforeEach(async () => {
		await setupTestingModule({});

		store = TestBed.inject(StarMapStore);
	});

	it('should create', () => {
		expect(store).toBeTruthy();
	});

	it('should start without a map or selected system', () => {
		expect(store.map()).toBeNull();
		expect(store.selectedSystemId()).toBeNull();
		expect(store.selectedSystem()).toBeNull();
	});

	it('should set the current map', () => {
		store.setMap(map);

		expect(store.map()).toBe(map);
	});

	it('should select a system', () => {
		store.setMap(map);

		store.selectSystem('S001');

		expect(store.selectedSystemId()).toBe('S001');

		expect(store.selectedSystem()).toBe(sol);
	});

	it('should return null when the selected system does not exist', () => {
		store.setMap(map);

		store.selectSystem('UNKNOWN');

		expect(store.selectedSystem()).toBeNull();
	});

	it('should deselect the current system', () => {
		store.setMap(map);
		store.selectSystem('S001');

		store.selectSystem(null);

		expect(store.selectedSystemId()).toBeNull();

		expect(store.selectedSystem()).toBeNull();
	});

	it('should clear the map and selected system', () => {
		store.setMap(map);
		store.selectSystem('S001');

		store.clear();

		expect(store.map()).toBeNull();
		expect(store.selectedSystemId()).toBeNull();
		expect(store.selectedSystem()).toBeNull();
	});

	describe('systems', () => {
		beforeEach(() => {
			store.setMap(structuredClone(map));
		});

		it('should update a system', () => {
			const updated: StarSystem = {
				...sol,
				name: 'Updated Sol'
			};

			store.updateSystem(updated);

			expect(store.map()?.systems).toContainEqual(updated);

			expect(store.map()?.systems.find((system) => system.id === 'S002')).toEqual(alpha);
		});

		it('should add and select a system', () => {
			const system: StarSystem = {
				id: 'S003',
				name: 'Beta',
				position: {
					x: 1,
					y: 1,
					z: 1
				},
				stars: [],
				planets: []
			};

			store.addSystem(system);

			expect(store.map()?.systems).toContainEqual(system);

			expect(store.selectedSystemId()).toBe('S003');

			expect(store.selectedSystem()).toEqual(system);
		});

		it('should delete a system', () => {
			store.deleteSystem('S001');

			expect(store.map()?.systems.some((system) => system.id === 'S001')).toBe(false);
		});

		it('should remove jump links connected to a deleted system', () => {
			store.deleteSystem('S001');

			expect(store.map()?.jumpLinks).toHaveLength(0);
		});

		it('should deselect a deleted selected system', () => {
			store.selectSystem('S001');

			store.deleteSystem('S001');

			expect(store.selectedSystemId()).toBeNull();
		});

		it('should keep another selected system when deleting a different system', () => {
			store.selectSystem('S002');

			store.deleteSystem('S001');

			expect(store.selectedSystemId()).toBe('S002');
		});
	});

	describe('jump links', () => {
		beforeEach(() => {
			store.setMap({
				...structuredClone(map),
				jumpLinks: []
			});
		});

		it('should add a jump link', () => {
			store.addJumpLink(jumpLink);

			expect(store.map()?.jumpLinks).toEqual([jumpLink]);
		});

		it('should not add the same jump link twice', () => {
			store.addJumpLink(jumpLink);

			store.addJumpLink({
				...jumpLink,
				id: 'J002'
			});

			expect(store.map()?.jumpLinks).toHaveLength(1);
		});

		it('should not add a reversed duplicate jump link', () => {
			store.addJumpLink(jumpLink);

			store.addJumpLink({
				id: 'J002',
				startSystemId: 'S002',
				endSystemId: 'S001',
				status: 'caution'
			});

			expect(store.map()?.jumpLinks).toHaveLength(1);
		});

		it('should update a jump link', () => {
			store.addJumpLink(jumpLink);

			const updated: JumpLink = {
				...jumpLink,
				status: 'dangerous'
			};

			store.updateJumpLink(updated);

			expect(store.map()?.jumpLinks).toEqual([updated]);
		});

		it('should delete a jump link', () => {
			store.addJumpLink(jumpLink);

			store.deleteJumpLink('J001');

			expect(store.map()?.jumpLinks).toHaveLength(0);
		});
	});

	describe('nebulae', () => {
		beforeEach(() => {
			store.setMap({
				...structuredClone(map),
				nebulae: []
			});
		});

		it('should add a nebula', () => {
			store.addNebula(nebula);

			expect(store.map()?.nebulae).toEqual([nebula]);
		});

		it('should update a nebula', () => {
			store.addNebula(nebula);

			const updated: Nebula = {
				...nebula,
				name: 'Updated Nebula',
				opacity: 0.7
			};

			store.updateNebula(updated);

			expect(store.map()?.nebulae).toEqual([updated]);
		});

		it('should delete a nebula', () => {
			store.addNebula(nebula);

			store.deleteNebula('N001');

			expect(store.map()?.nebulae).toHaveLength(0);
		});
	});

	it.each([
		['updateSystem', () => store.updateSystem(sol)],
		['deleteSystem', () => store.deleteSystem('S001')],
		['addJumpLink', () => store.addJumpLink(jumpLink)],
		['updateJumpLink', () => store.updateJumpLink(jumpLink)],
		['deleteJumpLink', () => store.deleteJumpLink('J001')],
		['addNebula', () => store.addNebula(nebula)],
		['updateNebula', () => store.updateNebula(nebula)],
		['deleteNebula', () => store.deleteNebula('N001')]
	])('should ignore %s when no map is loaded', (_name, action) => {
		action();

		expect(store.map()).toBeNull();
	});

	it('should select an added system even when no map is loaded', () => {
		store.addSystem(sol);

		expect(store.map()).toBeNull();

		expect(store.selectedSystemId()).toBe('S001');

		expect(store.selectedSystem()).toBeNull();
	});
});
