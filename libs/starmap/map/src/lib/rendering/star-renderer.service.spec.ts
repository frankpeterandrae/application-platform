/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarMap, StarSystem } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { StarRendererService } from './star-renderer.service';

describe('StarRendererService', () => {
	let service: StarRendererService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(StarRendererService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	describe('spectralTypeToValue', () => {
		it.each([
			['O0', 500],
			['B0', 510],
			['A0', 520],
			['F0', 530],
			['G0', 540],
			['K0', 550],
			['M0', 560],
			['G2', 542],
			['G2I', 142],
			['G2III', 342],
			['BD', 580],
			['WD', 600],
			['NS', 700],
			['BH', 800]
		] as const)('should convert %s to %d', (spectralType, expected) => {
			expect(service.spectralTypeToValue(spectralType)).toBe(expected);
		});

		it.each(['O5', 'B5', 'A5', 'F5', 'M5'])('should interpolate colors for %s stars', (spectralType) => {
			const map: StarMap = {
				id: 'map',
				name: 'Map',
				systems: [createSystem([spectralType])],
				jumpLinks: [],
				nebulae: []
			};

			const definitions = service.renderDefinitions(map);

			const gradient = definitions.querySelector(`#rg${spectralType}a`);

			expect(gradient).toBeTruthy();
			expect(gradient?.querySelector('stop')?.getAttribute('stop-color')).toBeTruthy();
		});
	});

	describe('getStarOffsets', () => {
		it.each([
			[1, [{ x: 0, y: 0 }]],
			[
				2,
				[
					{ x: -24, y: -24 },
					{ x: 24, y: 24 }
				]
			],
			[
				3,
				[
					{ x: -36, y: -36 },
					{ x: 36, y: -20 },
					{ x: -12, y: 36 }
				]
			],
			[
				4,
				[
					{ x: -36, y: -36 },
					{ x: 36, y: -36 },
					{ x: -36, y: 36 },
					{ x: 36, y: 36 }
				]
			],
			[
				5,
				[
					{ x: -44, y: -20 },
					{ x: 0, y: -48 },
					{ x: 44, y: -20 },
					{ x: 28, y: 32 },
					{ x: -28, y: 32 }
				]
			],
			[
				6,
				[
					{ x: -28, y: -48 },
					{ x: 28, y: -48 },
					{ x: 56, y: 0 },
					{ x: 28, y: 48 },
					{ x: -28, y: 48 },
					{ x: -56, y: 0 }
				]
			],
			[
				8,
				[
					{ x: -42, y: -42 },
					{ x: 0, y: -60 },
					{ x: 42, y: -42 },
					{ x: 60, y: 0 },
					{ x: 42, y: 42 },
					{ x: 0, y: 60 },
					{ x: -42, y: 42 },
					{ x: -60, y: 0 }
				]
			]
		] as const)('should return expected offsets for %d stars', (starCount, expected) => {
			expect(service.getStarOffsets(starCount)).toEqual(expected);
		});

		it('should add a center star for seven stars', () => {
			const offsets = service.getStarOffsets(7);

			expect(offsets).toHaveLength(7);
			expect(offsets[6]).toEqual({
				x: 0,
				y: 0
			});
		});

		it('should add a center star for nine stars', () => {
			const offsets = service.getStarOffsets(9);

			expect(offsets).toHaveLength(9);
			expect(offsets[8]).toEqual({
				x: 0,
				y: 0
			});
		});

		it('should add two inner stars for ten stars', () => {
			const offsets = service.getStarOffsets(10);

			expect(offsets).toHaveLength(10);

			expect(offsets.slice(-2)).toEqual([
				{ x: 20, y: -20 },
				{ x: -20, y: 20 }
			]);
		});

		it('should fall back to centered offsets for unsupported star counts', () => {
			expect(service.getStarOffsets(11)).toEqual(
				Array.from({ length: 11 }, () => ({
					x: 0,
					y: 0
				}))
			);
		});
	});

	describe('renderDefinitions', () => {
		it('should render three gradients for each unique spectral type', () => {
			const map: StarMap = {
				id: 'map',
				name: 'Map',
				systems: [createSystem(['G2', 'G2', 'K5'])],
				jumpLinks: [],
				nebulae: []
			};

			const definitions = service.renderDefinitions(map);

			const gradients = definitions.querySelectorAll('radialGradient');

			expect(gradients).toHaveLength(6);

			expect(definitions.querySelector('#rgG2a')).toBeTruthy();

			expect(definitions.querySelector('#rgK5c')).toBeTruthy();
		});

		it('should sanitize spectral types for gradient ids', () => {
			const map: StarMap = {
				id: 'map',
				name: 'Map',
				systems: [createSystem(['G2III'])],
				jumpLinks: [],
				nebulae: []
			};

			const definitions = service.renderDefinitions(map);

			expect(definitions.querySelector('#rgG2IIIa')).toBeTruthy();
		});

		it('should render the expected gradient structure', () => {
			const map: StarMap = {
				id: 'map',
				name: 'Map',
				systems: [createSystem(['G0'])],
				jumpLinks: [],
				nebulae: []
			};

			const definitions = service.renderDefinitions(map);

			const gradientA = definitions.querySelector('#rgG0a');

			const gradientB = definitions.querySelector('#rgG0b');

			const gradientC = definitions.querySelector('#rgG0c');

			expect(gradientA?.querySelectorAll('stop')).toHaveLength(2);

			expect(gradientB?.querySelectorAll('stop')).toHaveLength(3);

			expect(gradientC?.querySelectorAll('stop')).toHaveLength(3);
		});

		it('should interpolate colors for spectral subtypes', () => {
			const map: StarMap = {
				id: 'map',
				name: 'Map',
				systems: [createSystem(['G5'])],
				jumpLinks: [],
				nebulae: []
			};

			const definitions = service.renderDefinitions(map);

			const gradient = definitions.querySelector('#rgG5a');

			const stop = gradient?.querySelector('stop');

			expect(stop?.getAttribute('stop-color')).not.toBe('#fffcb6');
		});

		it('should render luminosity class I stars', () => {
			const map: StarMap = {
				id: 'map',
				name: 'Map',
				systems: [createSystem(['G2I'])],
				jumpLinks: [],
				nebulae: []
			};

			const definitions = service.renderDefinitions(map);

			expect(definitions.querySelector('#rgG2Ia')).toBeTruthy();
		});
	});

	describe('renderStars', () => {
		it('should render four circles for each star', () => {
			const system = createSystem(['G2', 'K5']);

			const group = service.renderStars(system);

			expect(group.children).toHaveLength(2);

			expect(group.querySelectorAll('circle')).toHaveLength(8);
		});

		it('should use the spectral type gradients as fills', () => {
			const system = createSystem(['G2']);

			const group = service.renderStars(system);

			const circles = group.querySelectorAll('circle');

			expect(circles[0].getAttribute('fill')).toBe('black');

			expect(circles[1].getAttribute('fill')).toBe('url(#rgG2a)');

			expect(circles[2].getAttribute('fill')).toBe('url(#rgG2b)');

			expect(circles[3].getAttribute('fill')).toBe('url(#rgG2c)');
		});

		it('should sort stars by spectral value before rendering', () => {
			const system = createSystem(['BH', 'G2']);

			const group = service.renderStars(system);

			const starGroups = Array.from(group.children);

			const firstCircles = starGroups[0].querySelectorAll('circle');

			expect(firstCircles[1].getAttribute('fill')).toBe('url(#rgG2a)');
		});

		it('should position stars using calculated offsets and star size', () => {
			const system = createSystem(['G0', 'G0']);

			const group = service.renderStars(system);

			expect(group.children[0].getAttribute('transform')).toBe('translate(-12,-12)');

			expect(group.children[1].getAttribute('transform')).toBe('translate(12,12)');
		});

		it('should render special stellar objects', () => {
			const system = createSystem(['BD', 'WD', 'NS', 'BH']);

			const group = service.renderStars(system);

			expect(group.children).toHaveLength(4);

			expect(group.querySelector('[fill="url(#rgBDa)"]')).toBeTruthy();

			expect(group.querySelector('[fill="url(#rgBHa)"]')).toBeTruthy();
		});
	});

	function createSystem(spectralTypes: string[]): StarSystem {
		return {
			id: 'S001',
			name: 'Test',
			position: {
				x: 0,
				y: 0,
				z: 0
			},
			stars: spectralTypes.map((spectralType) => ({
				spectralType
			})),
			planets: []
		};
	}
});
