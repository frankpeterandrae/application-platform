/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

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

	/**
	 * Callback function to handle changes in the input value.
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private onChange: (value: RangeInput) => void = () => {};
	/**
	 * Callback function to handle touch events on the input.
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private onTouched: () => void = () => {};

	/**
	 * Writes a new value to the input field.
	 * @internal
	 * @param {RangeInput} value - The new value.
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
	 * Sets the disabled state of the input field.
	 * @param {boolean} isDisabled - Whether the input should be disabled.
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
