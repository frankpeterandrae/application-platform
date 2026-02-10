/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RangeInput, RangeInputComponent } from '@application-platform/shared/ui-theme';
import { Logger } from '@application-platform/shared-ui';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * RangeInputDemoComponent demonstrates the usage of the RangeInput component.
 */
@Component({
	selector: 'demo-range-input',
	imports: [RangeInputComponent, DemoThemeContainerComponent, ReactiveFormsModule],
	templateUrl: './range-input-demo.component.html'
})
export class RangeInputDemoComponent {
	private readonly logger = inject(Logger);

	public readonly i18nTextModules = i18nTextModules;

	public rangeForm = new FormGroup<{ priceRange: FormControl<RangeInput> }>({
		priceRange: new FormControl<RangeInput>({ from: '100', to: '1000' }, { nonNullable: true })
	});

	/**
	 * Get the FormControl for the price range input.
	 * This control is used to bind the range input values to the form.
	 * @return The FormControl for priceRange.
	 */
	public get priceRangeControl(): FormControl<RangeInput> {
		return this.rangeForm.controls.priceRange;
	}

	/**
	 * Get the current "from" value from the price range form control.
	 * If the control or value is not set, it returns an empty string.
	 * This is used to display the current "from" value in the demo.
	 * @return The current "from" value as a string, or an empty string if not available.
	 */
	public get currentFrom(): string {
		return this.rangeForm.controls.priceRange.value.from;
	}

	/**
	 * Get the current "to" value from the price range form control.
	 * If the control or value is not set, it returns an empty string.
	 * This is used to display the current "to" value in the demo.
	 * @return The current "to" value as a string, or an empty string if not available.
	 */
	public get currentTo(): string {
		return this.rangeForm.controls.priceRange.value.to;
	}

	public description: Description = {
		title: i18nTextModules.RangeInput.lbl.Title,
		description: i18nTextModules.RangeInput.lbl.Description,
		usage: '<theme-range-input\n' + '\t[label]="\'Price Range\'"\n' + '\t[formControl]="priceRangeControl"\n' + '></theme-range-input>',
		language: 'html',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'label', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.RangeInput.lbl.LabelDescription,
							span: 5,
							columntype: 'string',
							type: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'formControl', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.RangeInput.lbl.FormControlDescription,
							span: 5,
							columntype: 'string',
							type: 'FormControl'
						}
					]
				},
				{
					columns: [
						{ value: 'valueChange', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.RangeInput.lbl.ValueChangeDescription,
							span: 5,
							columntype: 'string',
							type: 'OutputEmitterRef<RangeInput>',
							optional: true
						}
					]
				}
			]
		}
	};

	/**
	 * Handle value change event from the range input
	 * This method is called whenever the user changes the range values.
	 * It logs the new range values to the console for demonstration purposes.
	 * @param event The event object containing the new range values.
	 */
	public onValueChange(event: RangeInput): void {
		this.logger.info('Range value changed:', event);
	}
}
