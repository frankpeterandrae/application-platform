/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { ButtonColorDefinition, ButtonComponent, IconDefinition } from '@application-platform/shared/ui-theme';
import { Scopes, TranslationPipe } from '@application-platform/shared-ui';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 *
 */
@Component({
	selector: 'demo-button',
	imports: [ButtonComponent, DemoThemeContainerComponent, TranslationPipe],
	templateUrl: './button-demo.component.html'
})
export class ButtonDemoComponent {
	public readonly i18nTextModules = i18nTextModules;
	protected readonly ButtonColorDefinition = ButtonColorDefinition;
	protected readonly IconDefinition = IconDefinition;

	public description: Description = {
		title: i18nTextModules.Button.lbl.Title,
		description: i18nTextModules.Button.lbl.Description,
		usage:
			'<theme-button\n' +
			'\t[color]="ButtonColorDefinition.PRIMARY"\n' +
			'\t[buttonText]="\'Search\'"\n' +
			'\t[icon]="IconDefinition.SEARCH"\n' +
			'\t[iconEnd]="true"\n' +
			'\t[disabled]="true"\n' +
			'></theme-button>',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'color', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Button.lbl.ColorDescription,
							span: 5,
							columntype: 'string',
							type: 'ButtonColorDefinition'
						}
					]
				},
				{
					columns: [
						{ value: 'buttonText', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Button.lbl.ButtonTextDescription,
							span: 5,
							columntype: 'string',
							type: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'icon', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Button.lbl.IconDescription,
							span: 5,
							columntype: 'string',
							type: 'IconDefinition',
							optional: true
						}
					]
				},
				{
					columns: [
						{ value: 'iconEnd', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Button.lbl.IconEndDescription,
							span: 5,
							columntype: 'string',
							type: 'boolean',
							optional: true
						}
					]
				},
				{
					columns: [
						{ value: 'disabled', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Button.lbl.DisabledDescription,
							span: 5,
							columntype: 'string',
							type: 'boolean',
							optional: true
						}
					]
				}
			]
		}
	};
	protected readonly Scopes = Scopes;
}
