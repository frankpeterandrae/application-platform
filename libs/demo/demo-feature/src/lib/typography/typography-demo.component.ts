/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';

import { DemoThemeContainerComponent } from '../components/demo-theme-container.component';
import { Description } from '../components/description';
import { i18nTextModules } from '../i18n/i18n';

/**
 *
 */
@Component({
	selector: 'demo-typography',
	imports: [DemoThemeContainerComponent],
	templateUrl: './typography-demo.component.html'
})
export class TypographyDemoComponent {
	protected readonly i18nTextModules = i18nTextModules;

	public description: Description = {
		title: i18nTextModules.Typography.lbl.Title,
		description: i18nTextModules.Typography.lbl.Description,
		usage:
			'<h1>Überschrift 1</h1>\n' +
			'<h2>Überschrift 2</h2>\n\n' +
			'<p class="fpa-lead">Lead Text</p>\n' +
			'<p class="fpa-paragraph">Paragraph Text</p>\n' +
			'<p class="fpa-small">Small Text</p>\n' +
			'<p class="fpa-tiny">Tiny Text</p>'
	};
}
