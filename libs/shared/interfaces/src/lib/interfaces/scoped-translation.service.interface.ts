/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Signal } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 *
 */
export abstract class ScopedTranslationServiceInterface {
	public abstract currentLang: Signal<string>;
	public abstract translate(key: string, scope?: string, params?: Record<string, string>): string;
	public abstract selectTranslate(key: string, scope?: string, params?: Record<string, string>): Observable<string>;
	public abstract toggleLanguage(): void;
	public abstract getActiveLang(): void;
}
