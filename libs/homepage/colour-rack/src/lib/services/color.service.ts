/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { Color } from '../models/color.model';

/**
 * Loads colour-rack data from the application assets.
 */
@Injectable({
	providedIn: 'root'
})
export class ColorService {
	private readonly http = inject(HttpClient);
	private readonly colorsUrl = 'assets/colour-rack/colors.json';

	/** Loads the generated asset in physical rack order. Request failures propagate to the caller. */
	public getColors(): Observable<Color[]> {
		return this.http.get<Color[]>(this.colorsUrl);
	}
}
