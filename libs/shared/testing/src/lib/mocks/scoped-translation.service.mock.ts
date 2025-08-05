/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

// eslint-disable *
import { Injector, Signal, signal } from '@angular/core';
import * as jestMock from 'jest-mock';
import { HashMap, TranslocoScope } from '@jsverse/transloco';

type ScopeType = string | TranslocoScope | TranslocoScope[];
type SignalKey = Signal<string> | Signal<string[]> | Signal<string>[];
type TranslateSignalKey = string | string[] | SignalKey;
type TranslateSignalParams = HashMap | HashMap<Signal<string>> | Signal<HashMap>;
type TranslateSignalRef<T> = T extends unknown[] | Signal<string[]> ? Signal<string[]> : Signal<string>;

/**
 * Mock service for ScopedTranslationService.
 */
export class ScopedTranslationServiceMock {
	public currentLang = signal('en'); // Mock `currentLang` as a signal
	public toggleLanguage = jestMock.fn(); // Mock toggleLanguage method
}

/**
 * Mock service for ScopedTranslationService.
 */
export function TranslateSignalMock<T extends TranslateSignalKey>(
	key: T,
	params?: TranslateSignalParams,
	lang?: ScopeType,
	injector?: Injector
): TranslateSignalRef<T> {
	// unwrap if key is a Signal, otherwise use it directly
	const value = typeof (key as any) === 'function' ? (key as Signal<any>)() : key;

	// wrap the resulting string or array into a Signal
	return signal(value as any) as TranslateSignalRef<T>;
}
