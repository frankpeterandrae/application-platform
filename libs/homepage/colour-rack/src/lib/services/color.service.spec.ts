/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ColorType } from '../models/color-type.enum';
import type { Color } from '../models/color.model';

import { ColorService } from './color.service';

describe('ColorService', () => {
	let service: ColorService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ColorService, provideHttpClient(), provideHttpClientTesting()]
		});
		service = TestBed.inject(ColorService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should fetch colors successfully', () => {
		const mockColors: Color[] = [
			{
				name: 'Red',
				alternativeNames: [],
				highlighted: false,
				type: ColorType.ME,
				mainColor: '',
				wave: '',
				row: 1,
				column: 2
			},
			{
				name: 'Blue',
				alternativeNames: [],
				highlighted: false,
				type: ColorType.S,
				mainColor: '',
				wave: '',
				row: 3,
				column: 4
			}
		];

		service.getColors().subscribe((colors) => {
			expect(colors).toEqual(mockColors);
		});

		const req = httpMock.expectOne('assets/colors.json');
		expect(req.request.method).toBe('GET');
		req.flush(mockColors);
	});

	it('should handle empty color list', () => {
		const mockColors: Color[] = [];

		service.getColors().subscribe((colors) => {
			expect(colors).toEqual(mockColors);
		});

		const req = httpMock.expectOne('assets/colors.json');
		expect(req.request.method).toBe('GET');
		req.flush(mockColors);
	});

	it('should handle HTTP error', () => {
		const errorMessage = '404 error';

		service.getColors().subscribe(
			() => fail('expected an error, not colors'),
			(error) => expect(error.status).toBe(404)
		);

		const req = httpMock.expectOne('assets/colors.json');
		req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
	});
});
