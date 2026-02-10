/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { LanguageToggleComponent } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * LanguageToggleDemoComponent demonstrates the usage of the LanguageToggle component.
 */
@Component({
	selector: 'demo-language-toggle',
	imports: [LanguageToggleComponent, DemoThemeContainerComponent],
	templateUrl: './language-toggle-demo.component.html'
})
export class LanguageToggleDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public description: Description = {
		title: i18nTextModules.LanguageToggle.lbl.Title,
		description: i18nTextModules.LanguageToggle.lbl.Description,
		usage: '<theme-language-toggle></theme-language-toggle>',
		language: 'html'
	};
}
