/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from '@application-platform/shared/ui-theme';
import { Logger } from '@application-platform/shared-ui';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

export interface SelectOption {
	label: string;
	value: string;
}

/**
 * SelectDemoComponent demonstrates the usage of the Select component.
 */
@Component({
	selector: 'demo-select',
	imports: [SelectComponent, DemoThemeContainerComponent, ReactiveFormsModule],
	templateUrl: './select-demo.component.html'
})
export class SelectDemoComponent {
	private readonly logger = inject(Logger);
	public readonly i18nTextModules = i18nTextModules;

	public selectForm = new FormGroup<{ country: FormControl<string> }>({
		country: new FormControl<string>('', { nonNullable: true })
	});

	public countryOptions: SelectOption[] = [
		{ label: 'Germany', value: 'de' },
		{ label: 'United States', value: 'us' },
		{ label: 'United Kingdom', value: 'uk' },
		{ label: 'France', value: 'fr' },
		{ label: 'Spain', value: 'es' }
	];

	/**
	 * Get the FormControl for the country select input.
	 * This control is used to bind the selected country value to the form.
	 * @return The FormControl for country.
	 */
	public get selectControl(): FormControl<string> {
		return this.selectForm.controls.country;
	}

	/**
	 * Get the current selected country value from the form control.
	 * If the control or value is not set, it returns an empty string.
	 * This is used to display the current selected country in the demo.
	 * @return The current selected country value as a string, or an empty string if not available.
	 */
	public get currentValue(): string {
		return this.selectForm.controls.country.value;
	}

	public description: Description = {
		title: i18nTextModules.Select.lbl.Title,
		description: i18nTextModules.Select.lbl.Description,
		usage:
			'<theme-select\n' +
			'\t[label]="\'Select Country\'"\n' +
			'\t[options]="countryOptions"\n' +
			'\t[formControl]="countryControl"\n' +
			'></theme-select>',
		language: 'html',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'label', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Select.lbl.LabelDescription,
							span: 5,
							columntype: 'string',
							type: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'options', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Select.lbl.OptionsDescription,
							span: 5,
							columntype: 'string',
							type: 'SelectOption[]'
						}
					]
				},
				{
					columns: [
						{ value: 'formControl', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Select.lbl.FormControlDescription,
							span: 5,
							columntype: 'string',
							type: 'FormControl'
						}
					]
				},
				{
					columns: [
						{ value: 'multiple', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Select.lbl.MultipleDescription,
							span: 5,
							columntype: 'string',
							type: 'boolean',
							optional: true
						}
					]
				},
				{
					columns: [
						{ value: 'isDynamic', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Select.lbl.IsDynamicDescription,
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

	/**
	 * Handle select change event
	 */
	public onSelectChange(event: Event): void {
		this.logger.info('Select value changed:', event);
	}
}
