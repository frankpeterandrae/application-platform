/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { ButtonBarComponent, ButtonColorDefinition, CardComponent, IconDefinition } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * ButtonBarDemoComponent demonstrates the usage of the ButtonBar component.
 */
@Component({
	selector: 'demo-button-bar',
	imports: [ButtonBarComponent, DemoThemeContainerComponent, CardComponent],
	templateUrl: './button-bar-demo.component.html'
})
export class ButtonBarDemoComponent {
	public readonly i18nTextModules = i18nTextModules;
	public pre = `interface ButtonConfigModel {{'{'}
buttonText: string;
icon?: IconDefinition;
color: ButtonColorDefinition;
iconEnd?: boolean;
disabled?: boolean;
type?: 'submit' | 'reset' | 'button';
callback: () => void;
{{'}'}}`;

	protected readonly actionButtons = [
		{
			buttonText: 'Cancel',
			color: ButtonColorDefinition.DEFAULT,
			callback: (): void => {
				// Handle cancel action
			}
		},
		{
			buttonText: 'Save',
			color: ButtonColorDefinition.PRIMARY,
			icon: IconDefinition.SEARCH,
			callback: (): void => {
				// Handle save action
			}
		}
	];

	protected readonly navigationButtons = [
		{
			buttonText: 'Previous',
			color: ButtonColorDefinition.DEFAULT,
			icon: IconDefinition.ENGLISH,
			callback: (): void => {
				// Handle previous action
			}
		},
		{
			buttonText: 'Next',
			color: ButtonColorDefinition.PRIMARY,
			icon: IconDefinition.GERMAN,
			iconEnd: true,
			callback: (): void => {
				// Handle next action
			}
		}
	];

	protected readonly multipleActionsButtons = [
		{
			buttonText: 'Delete',
			color: ButtonColorDefinition.DANGER,
			icon: IconDefinition.BRUSH,
			callback: (): void => {
				// Handle delete action
			}
		},
		{
			buttonText: 'Edit',
			color: ButtonColorDefinition.INFO,
			icon: IconDefinition.SEARCH,
			callback: (): void => {
				// Handle edit action
			}
		},
		{
			buttonText: 'Download',
			color: ButtonColorDefinition.SUCCESS,
			icon: IconDefinition.CLOSE,
			callback: (): void => {
				// Handle download action
			}
		}
	];

	public description: Description = {
		title: i18nTextModules.ButtonBar.lbl.Title,
		description: i18nTextModules.ButtonBar.lbl.Description,
		usage:
			'<theme-button-bar\n' +
			'\t[buttons]="[\n' +
			'\t\t{\n' +
			"\t\t\tbuttonText: 'Cancel',\n" +
			'\t\t\tcolor: ButtonColorDefinition.DEFAULT,\n' +
			'\t\t\tcallback: () => handleCancel()\n' +
			'\t\t},\n' +
			'\t\t{\n' +
			"\t\t\tbuttonText: 'Save',\n" +
			'\t\t\tcolor: ButtonColorDefinition.PRIMARY,\n' +
			'\t\t\ticon: IconDefinition.SAVE,\n' +
			'\t\t\tcallback: () => handleSave()\n' +
			'\t\t}\n' +
			'\t]"\n' +
			'></theme-button-bar>',
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
}
