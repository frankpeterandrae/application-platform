/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { SvgExportService } from './svg-export.service';
import { SVG_PERSISTENCE } from './svg-persistence.token';

describe('SvgExportService', () => {
	let service: SvgExportService;

	const persistence = {
		save: vi.fn()
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		await setupTestingModule({
			providers: [
				{
					provide: SVG_PERSISTENCE,
					useValue: persistence
				}
			]
		});

		service = TestBed.inject(SvgExportService);
	});

	it('should serialize and save the svg', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

		circle.setAttribute('r', '10');

		svg.append(circle);

		service.export(svg, 'Test Map');

		expect(persistence.save).toHaveBeenCalledOnce();

		const [content, fileName] = persistence.save.mock.calls[0];

		expect(content).toContain('<svg');
		expect(content).toContain('<circle');
		expect(content).toContain('r="10"');

		expect(fileName).toBe('test-map.svg');
	});

	it.each([
		['Test Map', 'test-map.svg'],
		['  Test   Map  ', 'test-map.svg'],
		['HALO STARS', 'halo-stars.svg'],
		['Map_01', 'map_01.svg'],
		['Map-01', 'map-01.svg'],
		['Map ÄÖÜ!', 'map-.svg']
	])('should normalize "%s" to "%s"', (mapName, expected) => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		service.export(svg, mapName);

		expect(persistence.save).toHaveBeenCalledWith(expect.any(String), expected);
	});

	it('should use starmap as fallback file name', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		service.export(svg, ' !!! ');

		expect(persistence.save).toHaveBeenCalledWith(expect.any(String), 'starmap.svg');
	});
});
