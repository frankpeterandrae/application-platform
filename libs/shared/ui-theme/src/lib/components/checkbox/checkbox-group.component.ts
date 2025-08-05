/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, effect, forwardRef, input, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { CheckboxConfig } from './checkbox-config.model';

/**
 * A component that represents a group of checkboxes.
 * Implements the `ControlValueAccessor` interface to integrate with Angular forms.
 */
@Component({
	selector: 'theme-checkbox-group',
	imports: [CommonModule],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => CheckboxGroupComponent),
			multi: true
		}
	],
	styleUrls: ['./checkbox-group.base.scss', './checkbox-group.variants.scss'],
	templateUrl: './checkbox-group.component.html'
})
export class CheckboxGroupComponent implements ControlValueAccessor {
	public label = input<string>('');

	public checkboxes = input<CheckboxConfig[]>([]);

	public changeCheckbox = output<CheckboxConfig>();

	protected disabled = false;

	private _data: CheckboxConfig[] = [];
	private _value: string[] = [];

	/**
	 * Sets the value of the checkbox group.
	 * @param {string[]} val - The new value to set.
	 */
	private set value(val: string[]) {
		this._value = val;
	}

	/**
	 * Callback function to propagate changes to the parent form.
	 */
	private propagateChange: (value: string[]) => void = () => {
		/* noop */
	};

	/**
	 * Callback function to propagate touch events to the parent form.
	 */
	protected propagateTouch: (_: string) => void = () => {
		/* noop */
	};

	/**
	 * Constructor for the CheckboxGroupComponent.
	 * Uses the `effect` function to react to changes in the `checkboxes` input signal.
	 */
	constructor() {
		effect(() => {
			this._data = this.checkboxes();
			this.value = this.setValueBasedOnCheckboxes(this._data);
		});
	}

	/**
	 * Writes a new value to the component.
	 * This method is called by the Angular forms API to update the model value.
	 * @param {string[]} value - The new value to write.
	 */
	public writeValue(value: string[]): void {
		this.value = value;
	}

	/**
	 * Registers a callback function that is called when the model value changes.
	 * @param {(value: string[]) => void} fn - The callback function to register.
	 */
	public registerOnChange(fn: (value: string[]) => void): void {
		this.propagateChange = fn;
	}

	/**
	 * Registers a callback function that is called when the component is touched.
	 * @param {() => void} fn - The callback function to register.
	 */
	public registerOnTouched(fn: () => void): void {
		this.propagateTouch = fn;
	}

	/**
	 * Sets the disabled state of the component.
	 * This method is called by the Angular forms API to disable or enable the component.
	 * @param {boolean} isDisabled - A boolean indicating whether the component should be disabled.
	 */
	public setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
	}

	/**
	 * Sets the value based on the state of the checkboxes.
	 * @param {CheckboxConfig[]} checkboxes - An array of CheckboxConfig objects.
	 * @returns {string[]} - An array of values from the checked checkboxes.
	 */
	private setValueBasedOnCheckboxes(checkboxes: CheckboxConfig[]): string[] {
		return checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
	}

	/**
	 * Handles the change event when a checkbox is checked or unchecked.
	 * Updates the value and emits the change event.
	 * @param {Event} $event - The event object containing the checkbox state and value.
	 * @param {CheckboxConfig} checkbox - The checkbox configuration object.
	 */
	protected onCheckChange($event: Event, checkbox: CheckboxConfig): void {
		const target = $event.target as HTMLInputElement;
		this.value = target.checked ? [...this._value, target.value] : this._value.filter((value) => value !== target.value);

		this.propagateChange(this._value);
		this.changeCheckbox.emit({ ...checkbox, checked: target.checked });
	}
}
