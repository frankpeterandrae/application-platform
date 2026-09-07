/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarMap } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { StarMapSvgRendererService } from './star-map-svg-renderer.service';

describe('StarMapSvgRendererService', () => {
	let service: StarMapSvgRendererService;

	const map: StarMap = {
		id: 'map',
		name: 'Test Map',
		systems: [
			{
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
			}
		],
		jumpLinks: [],
		nebulae: []
	};

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(StarMapSvgRendererService);
	});

	it('should render an svg root element', () => {
		const svg = service.render(map);

		expect(svg).toBeInstanceOf(SVGSVGElement);

		expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
	});

	it('should set svg dimensions from the rendered map', () => {
		const svg = service.render(map);

		expect(svg.getAttribute('viewBox')).toBe('0 0 3300 3300');

		expect(svg.getAttribute('width')).toBe('3300');

		expect(svg.getAttribute('height')).toBe('3300');
	});

	it('should render the map background', () => {
		const svg = service.render(map);

		const background = svg.querySelector('#background rect');

		expect(background).toBeTruthy();

		expect(background?.getAttribute('fill')).toBe('black');

		expect(background?.getAttribute('width')).toBe('3300');

		expect(background?.getAttribute('height')).toBe('3300');
	});

	it('should render all primary map layers', () => {
		const svg = service.render(map);

		expect(svg.querySelector('defs')).toBeTruthy();

		expect(svg.querySelector('#background')).toBeTruthy();

		expect(svg.querySelector('#nebulae')).toBeTruthy();

		expect(svg.querySelector('#grid')).toBeTruthy();

		expect(svg.querySelector('#axis-labels')).toBeTruthy();

		expect(svg.querySelector('#jumps')).toBeTruthy();

		expect(svg.querySelector('#systems')).toBeTruthy();

		expect(svg.querySelector('#names')).toBeTruthy();
	});

	it('should render systems and their names', () => {
		const svg = service.render(map);

		expect(svg.querySelector('[data-system-id="S001"]')).toBeTruthy();

		expect(Array.from(svg.querySelectorAll('#names text')).some((label) => label.textContent === 'Sol')).toBe(true);
	});
});
