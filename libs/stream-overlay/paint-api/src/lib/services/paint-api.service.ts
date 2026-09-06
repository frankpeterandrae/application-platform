/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Paint, PaintBrandDefinition, PaintId } from '@application-platform/paint';
import { Observable } from 'rxjs';

/**
 * Provides access to the paint HTTP API.
 */
@Injectable({
	providedIn: 'root'
})
export class PaintApiService {
	private readonly http = inject(HttpClient);

	/**
	 * Retrieves all paint brands.
	 *
	 * @returns An observable containing all paint brand definitions.
	 */
	public getBrands(): Observable<PaintBrandDefinition[]> {
		return this.http.get<PaintBrandDefinition[]>('api/paint-brands');
	}

	/**
	 * Creates a new paint brand.
	 *
	 * @param brand The paint brand to create.
	 * @returns An observable containing the created paint brand.
	 */
	public createBrand(brand: PaintBrandDefinition): Observable<PaintBrandDefinition> {
		return this.http.post<PaintBrandDefinition>('api/paint-brands', brand);
	}

	/**
	 * Updates an existing paint brand.
	 *
	 * @param brand The paint brand to update.
	 * @returns An observable containing the updated paint brand.
	 */
	public updateBrand(brand: PaintBrandDefinition): Observable<PaintBrandDefinition> {
		return this.http.put<PaintBrandDefinition>(`api/paint-brands/${brand.id}`, brand);
	}

	/**
	 * Deletes a paint brand.
	 *
	 * @param id The ID of the paint brand to delete.
	 * @returns An observable that completes when the brand has been deleted.
	 */
	public deleteBrand(id: string): Observable<void> {
		return this.http.delete<void>(`api/paint-brands/${id}`);
	}

	/**
	 * Retrieves paints, optionally filtered by brand.
	 *
	 * @param brand Optional paint brand ID used to filter the result.
	 * @returns An observable containing the matching paints.
	 */
	public getPaints(brand?: string): Observable<Paint[]> {
		return this.http.get<Paint[]>('api/paints', { params: brand ? { brand } : {} });
	}

	/**
	 * Create a new paint
	 *
	 * @param paint Paint object to create
	 * @returns Observable of created Paint object
	 */
	public createPaint(paint: Paint): Observable<Paint> {
		return this.http.post<Paint>('api/paints', paint);
	}

	/**
	 * Update an existing paint
	 *
	 * @param paint Paint object to update
	 * @returns Observable of updated Paint object
	 */
	public updatePaint(paint: Paint): Observable<Paint> {
		return this.http.put<Paint>(`api/paints/${paint.id}`, paint);
	}

	/**
	 * Delete a paint by ID
	 *
	 * @param id ID of the paint to delete
	 * @returns Observable of void
	 */
	public deletePaint(id: PaintId): Observable<void> {
		return this.http.delete<void>(`api/paints/${id}`);
	}

	/**
	 * Retrieves the IDs of recently selected paints.
	 *
	 * @returns An observable containing the recently selected paint IDs.
	 */
	public getRecentPaints(): Observable<PaintId[]> {
		return this.http.get<PaintId[]>('api/recent');
	}
}
