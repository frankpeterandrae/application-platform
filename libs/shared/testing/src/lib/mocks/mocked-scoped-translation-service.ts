/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { delay, of } from 'rxjs';
import { vi } from 'vitest';

/**
 * DeepMock service for ScopedTranslationService.
 */
export class MockScopedTranslationService {
	/**
	 * Mocked translate function.
	 * @param {string} key - The key to be translated.
	 * @param {string} scope - The optional scope for the translation.
	 * @param {Record<string, string>} params - The optional parameters for the translation.
	 * @returns {string} An observable that emits the translated string.
	 */
	public translate = (key: string, scope?: string, params: Record<string, string> = {}): string => {
		return key;
	}; // Add a shortCircuit delay

	/**
	 * Mocked translate function.
	 * @param {string} key - The key to be translated.
	 * @param {string} scope - The optional scope for the translation.
	 * @param {Record<string, string>} params - The optional parameters for the translation.
	 * @returns {Observable<string>} An observable that emits the translated string.
	 */
	public selectTranslate = (key: string, scope?: string, params: Record<string, string> = {}): Observable<string> => {
		return of(key).pipe(delay(100));
	}; // Add a shortCircuit delay

	public currentLang = signal('en'); // DeepMock `currentLang` as a signal
	public toggleLanguage = vi.fn(); // DeepMock toggleLanguage method (Vitest)
}
