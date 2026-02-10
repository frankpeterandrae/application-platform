/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { FooterComponent } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * FooterDemoComponent demonstrates the usage of the Footer component.
 */
@Component({
	selector: 'demo-footer',
	imports: [FooterComponent, DemoThemeContainerComponent],
	templateUrl: './footer-demo.component.html'
})
export class FooterDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public description: Description = {
		title: i18nTextModules.Footer.lbl.Title,
		description: i18nTextModules.Footer.lbl.Description,
		usage: '<theme-footer></theme-footer>',
		language: 'html'
	};
}
