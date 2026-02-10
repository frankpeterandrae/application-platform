/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { CheckboxColorDefinition, CheckboxConfig, CheckboxGroupComponent } from '@application-platform/shared/ui-theme';
import { Scopes, TranslationPipe } from '@application-platform/shared-ui';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 *
 */
@Component({
	selector: 'demo-checkbox',
	imports: [CheckboxGroupComponent, DemoThemeContainerComponent, TranslationPipe],
	templateUrl: './checkbox-demo.component.html'
})
export class CheckboxDemoComponent {
	public readonly i18nTextModules = i18nTextModules;
	public readonly Scopes = Scopes;
	protected readonly CheckboxColorDefinition = CheckboxColorDefinition;

	public description: Description = {
		title: i18nTextModules.Checkbox.lbl.Title,
		description: i18nTextModules.Checkbox.lbl.Description,
		usage:
			'<theme-checkbox-group\n' +
			'\t[label]="\'My Checkbox Group\'"\n' +
			'\t[checkboxes]="checkboxes"\n' +
			'></theme-checkbox-group>',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'label', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Checkbox.lbl.LabelDescription,
							span: 5,
							columntype: 'string',
							type: 'string',
							optional: true
						}
					]
				},
				{
					columns: [
						{ value: 'checkboxes', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Checkbox.lbl.CheckboxesDescription,
							span: 5,
							columntype: 'string',
							type: 'CheckboxConfig[]'
						}
					]
				}
			]
		}
	};

	public checkboxes: CheckboxConfig[] = [
		{
			label: CheckboxColorDefinition.LIGHT_SHADES,
			id: CheckboxColorDefinition.LIGHT_SHADES,
			value: CheckboxColorDefinition.LIGHT_SHADES,
			color: CheckboxColorDefinition.LIGHT_SHADES
		},
		{
			label: CheckboxColorDefinition.LIGHT_ACCENT,
			id: CheckboxColorDefinition.LIGHT_ACCENT,
			value: CheckboxColorDefinition.LIGHT_ACCENT,
			color: CheckboxColorDefinition.LIGHT_ACCENT
		},
		{
			label: CheckboxColorDefinition.MAIN_BAND,
			id: CheckboxColorDefinition.MAIN_BAND,
			value: CheckboxColorDefinition.MAIN_BAND,
			color: CheckboxColorDefinition.MAIN_BAND
		},
		{
			label: CheckboxColorDefinition.DARK_ACCENT,
			id: CheckboxColorDefinition.DARK_ACCENT,
			value: CheckboxColorDefinition.DARK_ACCENT,
			color: CheckboxColorDefinition.DARK_ACCENT
		},
		{
			label: CheckboxColorDefinition.DARK_SHADES,
			id: CheckboxColorDefinition.DARK_SHADES,
			value: CheckboxColorDefinition.DARK_SHADES,
			color: CheckboxColorDefinition.DARK_SHADES
		},
		{
			label: CheckboxColorDefinition.SUCCESS,
			id: CheckboxColorDefinition.SUCCESS,
			value: CheckboxColorDefinition.SUCCESS,
			color: CheckboxColorDefinition.SUCCESS
		}
	];
}
