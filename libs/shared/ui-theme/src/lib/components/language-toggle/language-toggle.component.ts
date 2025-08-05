/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject } from '@angular/core';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';
import { IconDefinition } from '../../enums';
import { ScopedTranslationServiceInterface } from '@angular-apps/interfaces';

/**
 * Component for toggling the language of the application.
 */
@Component({
	selector: 'theme-language-toggle',
	imports: [FastSvgComponent],
	templateUrl: './language-toggle.component.html',
	styleUrls: ['./language-toggle.component.scss']
})
export class LanguageToggleComponent {
	/** Service for handling translations and language changes. */
	private readonly translationService = inject(ScopedTranslationServiceInterface);

	/** Icon definitions used in the component. */
	protected readonly IconDefinition = IconDefinition;

	/** Current language of the application. */
	public language = this.translationService.currentLang;

	/**
	 * Toggles the language of the application.
	 */
	public toggleLanguage(): void {
		this.translationService.toggleLanguage();
	}
}
