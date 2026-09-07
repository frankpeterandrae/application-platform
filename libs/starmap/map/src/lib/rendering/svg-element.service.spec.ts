/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import { SvgElementService } from './svg-element.service';

describe('SvgElementService', () => {
	let service: SvgElementService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(SvgElementService);
	});

	it('should create an SVG element with the SVG namespace', () => {
		const circle = service.create('circle');

		expect(circle.localName).toBe('circle');
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});
});
