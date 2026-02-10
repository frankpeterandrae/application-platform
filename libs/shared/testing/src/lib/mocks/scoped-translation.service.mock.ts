/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

// eslint-disable *
import { signal, type Injector, type Signal } from '@angular/core';
import type { TranslocoScope } from '@jsverse/transloco';
import * as jestMock from 'jest-mock';

/** @internal HashMap type for transloco compatibility */
type HashMap<T = unknown> = Record<string, T>;

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
	const value = typeof (key as unknown) === 'function' ? (key as Signal<unknown>)() : (key as string | string[]);

	// wrap the resulting string or array into a Signal
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- adapter wrapping to Signal for tests
	return signal(value as any) as TranslateSignalRef<T>;
}
