/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { CardComponent, CheckboxColorDefinition, CheckboxConfig, CheckboxGroupComponent } from '@application-platform/shared/ui-theme';

/**
 *
 */
@Component({
	selector: 'demo-checkbox',
	imports: [CheckboxGroupComponent, CardComponent],
	templateUrl: './checkbox-demo.component.html'
})
export class CheckboxDemoComponent {
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
