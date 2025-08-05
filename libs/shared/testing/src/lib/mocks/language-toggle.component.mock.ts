/*
 * Copyright (c) 2024. Frank-Peter Andrä
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
export class LanguageToggleComponentMock {
	// Mock any properties or methods with Jest
	public language = 'en'; // Mock as an observable if `currentLang` is an observable
}
