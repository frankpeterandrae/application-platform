/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Signal } from '@angular/core';

/**
 *
 */
export abstract class ScopedTranslationServiceInterface {
	public abstract currentLang: Signal<string>;
	public abstract toggleLanguage(): void;
	public abstract getActiveLang(): void;
}
