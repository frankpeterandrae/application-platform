/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { FILE_PERSISTENCE } from '@application-platform/shared-ui';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { SvgExportService } from './svg-export.service';

describe('SvgExportService', () => {
	let service: SvgExportService;

	const persistence = {
		open: vi.fn(),
		save: vi.fn()
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		await setupTestingModule({
			providers: [
				{
					provide: FILE_PERSISTENCE,
					useValue: persistence
				}
			]
		});

		service = TestBed.inject(SvgExportService);
	});

	it('should serialize and save the svg', async () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

		circle.setAttribute('r', '10');

		svg.append(circle);

		await service.export(svg, 'Test Map');

		expect(persistence.save).toHaveBeenCalledOnce();

		const [content, options] = persistence.save.mock.calls[0];

		expect(content).toContain('<svg');
		expect(content).toContain('<circle');
		expect(content).toContain('r="10"');

		expect(options).toEqual({
			fileName: 'test-map.svg',
			extensions: ['svg'],
			mimeType: 'image/svg+xml;charset=utf-8'
		});
	});

	it.each([
		['Test Map', 'test-map.svg'],
		['  Test   Map  ', 'test-map.svg'],
		['HALO STARS', 'halo-stars.svg'],
		['Map_01', 'map_01.svg'],
		['Map-01', 'map-01.svg'],
		['Map ÄÖÜ!', 'map-.svg']
	])('should normalize "%s" to "%s"', async (mapName, expected) => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		await service.export(svg, mapName);

		expect(persistence.save).toHaveBeenCalledWith(expect.any(String), {
			fileName: expected,
			extensions: ['svg'],
			mimeType: 'image/svg+xml;charset=utf-8'
		});
	});

	it('should use starmap as fallback file name', async () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		await service.export(svg, ' !!! ');

		expect(persistence.save).toHaveBeenCalledWith(expect.any(String), {
			fileName: 'starmap.svg',
			extensions: ['svg'],
			mimeType: 'image/svg+xml;charset=utf-8'
		});
	});
});
