/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * TranslocoHttpLoader is an Angular service that implements the TranslocoLoader interface.
 * It is responsible for loading translation files over HTTP.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
	private readonly http = inject(HttpClient);

	/**
	 * Fetches the translation file for the specified language.
	 * @param {string} lang - The language code for the translation file to be fetched.
	 * @returns {Observable<Translation>} An observable that emits the translation data.
	 */
	public getTranslation(lang: string): Observable<Translation> {
		return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
	}
}
