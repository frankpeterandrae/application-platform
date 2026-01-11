/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Color } from '../models/color.model';

/**
 * Service to handle color-related operations.
 * Provided in the root module.
 */
@Injectable({
	providedIn: 'root'
})
export class ColorService {
	private readonly http = inject(HttpClient);

	private readonly colorsUrl = 'assets/colors.json';

	/**
	 * Fetches the list of colors from the JSON file.
	 * @returns {Observable<Color[]>} An observable containing an array of colors.
	 */
	public getColors(): Observable<Color[]> {
		return this.http.get<Color[]>(this.colorsUrl);
	}
}
