/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { PipeTransform } from '@angular/core';
import { inject, Pipe } from '@angular/core';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import type { Observable } from 'rxjs';

/**
 * TranslationPipe is an Angular pipe that transforms a given string value
 * into its translated equivalent using the `translate` function from `@jsverse/transloco`.
 */
@Pipe({
	name: 'fpaTranslate',
	standalone: true
})
export class TranslationPipe implements PipeTransform {
	private readonly translocoService = inject(ScopedTranslationServiceInterface);

	/**
	 * Transforms the input value to a translated string.
	 * @param {string} key - The key to be translated.
	 * @param {string} scope - The scope for the translation.
	 * @param {Record<string, string>} [params] - Optional parameters for the translation.
	 * @returns {Observable<string>} An observable that emits the translated value.
	 */
	public transform(key: string, scope?: string, params: Record<string, string> = {}): Observable<string> {
		return this.translocoService.selectTranslate(key, scope, params);
	}
}
