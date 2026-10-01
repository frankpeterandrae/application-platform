/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Signal } from '@angular/core';

/**
 * Contract for services that manage the active translation language.
 */
export abstract class ScopedTranslationServiceInterface {
	public abstract currentLang: Signal<string>;
	public abstract toggleLanguage(): void;
	public abstract syncActiveLang(): void;
}
