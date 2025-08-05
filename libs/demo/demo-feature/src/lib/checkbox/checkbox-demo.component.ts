/*
 * Copyright (c) 2025. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { CardComponent, CheckboxConfig, CheckboxGroupComponent, CheckboxColorDefinition } from '@angular-apps/shared/ui-theme';

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
			label: CheckboxColorDefinition.LINEN,
			id: CheckboxColorDefinition.LINEN,
			value: CheckboxColorDefinition.LINEN,
			color: CheckboxColorDefinition.LINEN
		},
		{
			label: CheckboxColorDefinition.SANDY_BROWN,
			id: CheckboxColorDefinition.SANDY_BROWN,
			value: CheckboxColorDefinition.SANDY_BROWN,
			color: CheckboxColorDefinition.SANDY_BROWN
		},
		{
			label: CheckboxColorDefinition.CRIMSON,
			id: CheckboxColorDefinition.CRIMSON,
			value: CheckboxColorDefinition.CRIMSON,
			color: CheckboxColorDefinition.CRIMSON
		},
		{
			label: CheckboxColorDefinition.SLATE_GRAY,
			id: CheckboxColorDefinition.SLATE_GRAY,
			value: CheckboxColorDefinition.SLATE_GRAY,
			color: CheckboxColorDefinition.SLATE_GRAY
		},
		{
			label: CheckboxColorDefinition.EBONY,
			id: CheckboxColorDefinition.EBONY,
			value: CheckboxColorDefinition.EBONY,
			color: CheckboxColorDefinition.EBONY
		},
		{
			label: CheckboxColorDefinition.SUCCESS,
			id: CheckboxColorDefinition.SUCCESS,
			value: CheckboxColorDefinition.SUCCESS,
			color: CheckboxColorDefinition.SUCCESS
		}
	];
}
