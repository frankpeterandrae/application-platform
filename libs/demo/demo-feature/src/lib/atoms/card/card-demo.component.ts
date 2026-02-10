/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { CardComponent } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * CardDemoComponent demonstrates the usage of the Card component.
 */
@Component({
	selector: 'demo-card',
	imports: [CardComponent, DemoThemeContainerComponent],
	templateUrl: './card-demo.component.html'
})
export class CardDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public description: Description = {
		title: i18nTextModules.Card.lbl.Title,
		description: i18nTextModules.Card.lbl.Description,
		usage:
			'<theme-card>\n' +
			'\t<h3>Card Title</h3>\n' +
			'\t<p>Card content goes here...</p>\n' +
			'</theme-card>\n\n' +
			'<theme-card [inverted]="true">\n' +
			'\t<h3>Inverted Card</h3>\n' +
			'\t<p>Inverted card content...</p>\n' +
			'</theme-card>',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'inverted', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Card.lbl.InvertedDescription,
							span: 5,
							columntype: 'string',
							type: 'boolean'
						}
					]
				}
			]
		}
	};
}
