/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Component } from '@angular/core';

/**
 *MOCK of the LanguageToggleComponent.
 */
@Component({
	selector: 'theme-language-toggle',
	template: '',
	standalone: true
})
export class MockedLanguageToggleComponent {
	// Mock any properties or methods
	public language = 'en'; // Mock as an observable if `currentLang` is an observable
}
