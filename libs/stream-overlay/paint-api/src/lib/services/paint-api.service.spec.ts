/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Paint, PaintBrandDefinition, PaintId } from '@application-platform/paint';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { PaintApiService } from './paint-api.service';

describe('PaintApiService', () => {
	let service: PaintApiService;
	let httpTestingController: HttpTestingController;

	const brand: PaintBrandDefinition = {
		id: 'citadel',
		label: 'Citadel'
	};

	const paint: Paint = {
		id: 'citadel:21-03',
		brand: 'citadel',
		sku: '21-03',
		name: 'Mephiston Red',
		mainColor: '#991115',
		colorGroups: ['red']
	};

	beforeEach(async () => {
		await setupTestingModule({
			providers: [PaintApiService, provideHttpClient(), provideHttpClientTesting()]
		});

		service = TestBed.inject(PaintApiService);
		httpTestingController = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpTestingController.verify();
	});

	describe('brands', () => {
		it('should get all brands', () => {
			const response = [brand];

			service.getBrands().subscribe((result) => {
				expect(result).toEqual(response);
			});

			const request = httpTestingController.expectOne('api/paint-brands');

			expect(request.request.method).toBe('GET');

			request.flush(response);
		});

		it('should create a brand', () => {
			service.createBrand(brand).subscribe((result) => {
				expect(result).toEqual(brand);
			});

			const request = httpTestingController.expectOne('api/paint-brands');

			expect(request.request.method).toBe('POST');
			expect(request.request.body).toEqual(brand);

			request.flush(brand);
		});

		it('should update a brand', () => {
			service.updateBrand(brand).subscribe((result) => {
				expect(result).toEqual(brand);
			});

			const request = httpTestingController.expectOne(`api/paint-brands/${brand.id}`);

			expect(request.request.method).toBe('PUT');
			expect(request.request.body).toEqual(brand);

			request.flush(brand);
		});

		it('should delete a brand', () => {
			service.deleteBrand(brand.id).subscribe();

			const request = httpTestingController.expectOne(`api/paint-brands/${brand.id}`);

			expect(request.request.method).toBe('DELETE');

			request.flush(null);
		});
	});

	describe('paints', () => {
		it('should get all paints without brand filter', () => {
			const response = [paint];

			service.getPaints().subscribe((result) => {
				expect(result).toEqual(response);
			});

			const request = httpTestingController.expectOne(
				(request) => request.url === 'api/paints' && request.params.keys().length === 0
			);

			expect(request.request.method).toBe('GET');

			request.flush(response);
		});

		it('should get paints filtered by brand', () => {
			const response = [paint];

			service.getPaints('citadel').subscribe((result) => {
				expect(result).toEqual(response);
			});

			const request = httpTestingController.expectOne(
				(request) => request.url === 'api/paints' && request.params.get('brand') === 'citadel'
			);

			expect(request.request.method).toBe('GET');

			request.flush(response);
		});

		it('should create a paint', () => {
			service.createPaint(paint).subscribe((result) => {
				expect(result).toEqual(paint);
			});

			const request = httpTestingController.expectOne('api/paints');

			expect(request.request.method).toBe('POST');
			expect(request.request.body).toEqual(paint);

			request.flush(paint);
		});

		it('should update a paint', () => {
			service.updatePaint(paint).subscribe((result) => {
				expect(result).toEqual(paint);
			});

			const request = httpTestingController.expectOne(`api/paints/${paint.id}`);

			expect(request.request.method).toBe('PUT');
			expect(request.request.body).toEqual(paint);

			request.flush(paint);
		});

		it('should delete a paint', () => {
			service.deletePaint(paint.id).subscribe();

			const request = httpTestingController.expectOne(`api/paints/${paint.id}`);

			expect(request.request.method).toBe('DELETE');

			request.flush(null);
		});
	});

	it('should get recent paint ids', () => {
		const recent: PaintId[] = ['citadel:21-03', 'citadel:21-04'];

		service.getRecentPaints().subscribe((result) => {
			expect(result).toEqual(recent);
		});

		const request = httpTestingController.expectOne('api/recent');

		expect(request.request.method).toBe('GET');

		request.flush(recent);
	});
});
