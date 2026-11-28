/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';
import type { Color } from '../models/color.model';

import { ColorService } from './color.service';

describe('ColorService', () => {
	let service: ColorService;
	let httpMock: HttpTestingController;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [ColorService, provideHttpClient(), provideHttpClientTesting()]
		});

		service = TestBed.inject(ColorService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should load colors from the colour-rack assets', () => {
		const colors: Color[] = [
			{
				name: 'Test Color',
				sku: '001',
				alternativeNames: [],
				type: 'M',
				mainColor: '#123456'
			}
		];

		service.getColors().subscribe((result) => {
			expect(result).toEqual(colors);
		});

		const request = httpMock.expectOne('assets/colour-rack/colors.json');

		expect(request.request.method).toBe('GET');

		request.flush(colors);
	});

	it('should return an empty color list', () => {
		service.getColors().subscribe((result) => {
			expect(result).toEqual([]);
		});

		const request = httpMock.expectOne('assets/colour-rack/colors.json');

		request.flush([]);
	});

	it('should propagate HTTP errors', () => {
		service.getColors().subscribe({
			next: () => fail('expected request to fail'),
			error: (error) => {
				expect(error.status).toBe(404);
			}
		});

		const request = httpMock.expectOne('assets/colour-rack/colors.json');

		request.flush('Not Found', {
			status: 404,
			statusText: 'Not Found'
		});
	});
});
