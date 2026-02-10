/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, forwardRef, input, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

import { InputComponent } from '../input/input.component';

export interface RangeInput {
	from: string;
	to: string;
}

/**
 * RangeInputComponent is a standalone component that represents a range input field.
 * It implements the ControlValueAccessor interface to integrate with Angular forms.
 */
@Component({
	selector: 'theme-range-input',
	imports: [InputComponent, ReactiveFormsModule],
	templateUrl: './range-input.component.html',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => RangeInputComponent),
			multi: true
		}
	]
})
export class RangeInputComponent implements ControlValueAccessor {
	public label = input.required<string>();

	// Define output using the `output` function
	public valueChange = output<RangeInput>();

	public inputFocused = false;
	public value: RangeInput = { from: '', to: '' };

	/**
	 * Callback function to handle changes in the input value.
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public onChange: (value: RangeInput) => void = () => {};
	/**
	 * Callback function to handle touch events on the input.
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public onTouched: () => void = () => {};

	/**
	 * Writes a new value to the input field.
	 * @internal
	 * @param {RangeInput} value - The new value.
	 */
	public writeValue(value: RangeInput): void {
		this.value = value;
	}

	/**
	 * Registers a callback function to be called when the input value changes.
	 * @internal
	 * @param {(value: RangeInput) => void} fn - The callback function.
	 */
	public registerOnChange(fn: (value: RangeInput) => void): void {
		this.onChange = fn;
	}

	/**
	 * Registers a callback function to be called when the input is touched.
	 * @internal
	 * @param {() => void} fn - The callback function.
	 */
	public registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}
}
