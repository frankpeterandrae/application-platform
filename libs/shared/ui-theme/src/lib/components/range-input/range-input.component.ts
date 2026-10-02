/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { InputComponent } from '../input/input.component';

/**
 * Represents the lower and upper bounds of a range.
 */
export interface RangeInput {
	from: string;
	to: string;
}

/**
 * Combines two text inputs into an Angular forms-compatible range control.
 */
@Component({
	selector: 'theme-range-input',
	imports: [InputComponent, FormsModule],
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
	public readonly label = input.required<string>();

	public readonly valueChange = output<RangeInput>();

	public readonly value = signal<RangeInput>({
		from: '',
		to: ''
	});

	public readonly formDisabled = signal(false);

	private onChange: (value: RangeInput) => void = () => undefined;
	private onTouched: () => void = () => undefined;

	/**
	 * Writes a value from Angular forms to the range control.
	 *
	 * @param value The range value to render.
	 * @returns Nothing.
	 */
	public writeValue(value: RangeInput | null | undefined): void {
		this.value.set({
			from: value?.from ?? '',
			to: value?.to ?? ''
		});
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

	/**
	 * Sets the disabled state supplied by Angular forms.
	 *
	 * @param isDisabled Whether the control is disabled.
	 * @returns Nothing.
	 */
	public setDisabledState(isDisabled: boolean): void {
		this.formDisabled.set(isDisabled);
	}

	protected onFromChange(from: string): void {
		this.updateValue({
			...this.value(),
			from
		});
	}

	protected onToChange(to: string): void {
		this.updateValue({
			...this.value(),
			to
		});
	}

	protected onBlur(): void {
		this.onTouched();
	}

	private updateValue(value: RangeInput): void {
		this.value.set(value);
		this.onChange(value);
		this.valueChange.emit(value);
	}
}
