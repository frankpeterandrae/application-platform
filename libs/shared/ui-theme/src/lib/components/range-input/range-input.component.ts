import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../input/input.component';
import { ControlValueAccessor, ReactiveFormsModule } from '@angular/forms';

export interface RangeInput {
	from: string;
	to: string;
}

/**
 *
 */
@Component({
	selector: 'theme-range-input',
	imports: [CommonModule, InputComponent, ReactiveFormsModule],
	templateUrl: './range-input.component.html'
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
	public onChange: (value: string) => void = () => {};
	/**
	 * Callback function to handle touch events on the input.
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public onTouched: () => void = () => {};

	/**
	 * Writes a new value to the input field.
	 * @internal
	 * @param {string} value - The new value.
	 */
	public writeValue(value: RangeInput): void {
		this.value = value;
	}

	/**
	 * Registers a callback function to be called when the input value changes.
	 * @internal
	 * @param {any} fn - The callback function.
	 */
	public registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	/**
	 * Registers a callback function to be called when the input is touched.
	 * @internal
	 * @param {any} fn - The callback function.
	 */
	public registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}
}
