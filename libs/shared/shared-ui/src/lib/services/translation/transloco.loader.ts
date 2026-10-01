/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import type { Observable } from 'rxjs';

/**
 * Loads translation data over HTTP.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
	private readonly http = inject(HttpClient);

	/**
	 * Loads the translation file for the given language or scoped translation path.
	 *
	 * @param lang The language code or scoped translation path.
	 * @returns An observable containing the translation data.
	 */
	public getTranslation(lang: string): Observable<Translation> {
		const path = lang.includes('/') ? `/assets/${lang}.json` : `/assets/i18n/${lang}.json`;
		return this.http.get<Translation>(path);
	}
}
