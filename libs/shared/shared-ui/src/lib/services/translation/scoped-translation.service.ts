/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { computed, inject, Injectable, signal } from '@angular/core';
import type { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Manages the active application language and exposes it as a signal.
 */
@Injectable({ providedIn: 'root' })
export class ScopedTranslationService implements ScopedTranslationServiceInterface {
	private readonly translocoService = inject(TranslocoService);

	readonly #currentLang = signal<string>('');
	public readonly currentLang = computed(this.#currentLang);

	constructor() {
		this.translocoService.setActiveLang('de');
		this.syncActiveLang();
	}

	/**
	 * Switches to the next available language.
	 */
	public toggleLanguage(): void {
		const availableLangs = this.translocoService.getAvailableLangs();
		const currentLang = this.translocoService.getActiveLang();
		const nextLang = availableLangs.find((lang) => lang !== currentLang) as string;

		this.translocoService.setActiveLang(nextLang);
		this.syncActiveLang();
	}

	/**
	 * Synchronizes the current language signal with Transloco.
	 */
	public syncActiveLang(): void {
		this.#currentLang.set(this.translocoService.getActiveLang());
	}
}
