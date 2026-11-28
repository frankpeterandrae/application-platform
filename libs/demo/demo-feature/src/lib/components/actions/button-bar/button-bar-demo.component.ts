/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { ButtonBarComponent, ButtonColorDefinition, CardComponent, IconDefinition } from '@application-platform/shared/ui-theme';

import { i18nTextModules } from '../../../i18n/i18n';
import { DemoThemeContainerComponent } from '../../demo-theme-container.component';
import { Description } from '../../description';

/** Compares action, navigation, and multi-action button groups. */
@Component({
	selector: 'demo-button-bar',
	imports: [ButtonBarComponent, DemoThemeContainerComponent, CardComponent],
	templateUrl: './button-bar-demo.component.html'
})
export class ButtonBarDemoComponent {
	protected readonly buttonConfigExample = `interface ButtonConfigModel {
	buttonText: string;
	icon?: IconDefinition;
	color: ButtonColorDefinition;
	iconEnd?: boolean;
	disabled?: boolean;
	type?: 'submit' | 'reset' | 'button';
	callback: () => void;
}`;

	protected readonly actionButtons = [
		{
			buttonText: 'Cancel',
			color: ButtonColorDefinition.DEFAULT,
			callback: (): void => this.noOp()
		},
		{
			buttonText: 'Save',
			color: ButtonColorDefinition.PRIMARY,
			icon: IconDefinition.CHECK,
			callback: (): void => this.noOp()
		}
	];

	protected readonly navigationButtons = [
		{
			buttonText: 'Previous',
			color: ButtonColorDefinition.DEFAULT,
			icon: IconDefinition.CARET_LEFT,
			callback: (): void => this.noOp()
		},
		{
			buttonText: 'Next',
			color: ButtonColorDefinition.PRIMARY,
			icon: IconDefinition.CARET_RIGHT,
			iconEnd: true,
			callback: (): void => this.noOp()
		}
	];

	protected readonly multipleActionsButtons = [
		{
			buttonText: 'Delete',
			color: ButtonColorDefinition.DANGER,
			icon: IconDefinition.TRASH_CAN,
			callback: (): void => this.noOp()
		},
		{
			buttonText: 'Edit',
			color: ButtonColorDefinition.INFO,
			icon: IconDefinition.BRUSH,
			callback: (): void => this.noOp()
		}
	];

	protected readonly description: Description = {
		title: i18nTextModules.ButtonBar.lbl.Title,
		description: i18nTextModules.ButtonBar.lbl.Description,
		usage: String.raw`<theme-button-bar\n\t[buttons]="[\n\t\t{\n\t\t\tbuttonText: 'Cancel',\n\t\t\tcolor: ButtonColorDefinition.DEFAULT,\n\t\t\tcallback: () => handleCancel()\n\t\t},\n\t\t{\n\t\t\tbuttonText: 'Save',\n\t\t\tcolor: ButtonColorDefinition.PRIMARY,\n\t\t\ticon: IconDefinition.CHECK,\n\t\t\tcallback: () => handleSave()\n\t\t}\n\t]"\n></theme-button-bar>`,
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'buttons', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.ButtonBar.lbl.ButtonsDescription,
							span: 5,
							columntype: 'string',
							type: 'ButtonConfigModel[]'
						}
					]
				}
			]
		}
	};

	private readonly noOp = (): void => undefined;
}
