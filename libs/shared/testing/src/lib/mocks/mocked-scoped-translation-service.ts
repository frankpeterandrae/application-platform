/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { signal } from '@angular/core';
import * as jestMock from 'jest-mock';
import type { Observable } from 'rxjs';
import { delay, of } from 'rxjs';

/**
 * Mock service for ScopedTranslationService.
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
	}; // Add a short delay

	/**
	 * Mocked translate function.
	 * @param {string} key - The key to be translated.
	 * @param {string} scope - The optional scope for the translation.
	 * @param {Record<string, string>} params - The optional parameters for the translation.
	 * @returns {Observable<string>} An observable that emits the translated string.
	 */
	public selectTranslate = (key: string, scope?: string, params: Record<string, string> = {}): Observable<string> => {
		return of(key).pipe(delay(100));
	}; // Add a short delay

	public currentLang = signal('en'); // Mock `currentLang` as a signal
	public toggleLanguage = jestMock.fn(); // Mock toggleLanguage method
}
