/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import type { ElementRef } from '@angular/core';
import { Component, forwardRef, input, output, viewChild } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

import { IconDefinition } from '../../enums';

/**
 * InputComponent is a custom Angular component that implements ControlValueAccessor
 * to provide a reusable input field with various configurable properties.
 */
@Component({
	selector: 'theme-input',
	imports: [CommonModule, FastSvgComponent, FormsModule, ReactiveFormsModule],
	templateUrl: './input.component.html',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => InputComponent),
			multi: true
		}
	]
})
export class InputComponent implements ControlValueAccessor {
	public readonly searchInput = viewChild.required<ElementRef>('searchInput');
	public label = input<string>('');
	public type = input<string>('text');
	public placeholder = input<string>('');
	public icon = input<IconDefinition>(IconDefinition.NONE);
	public isDynamic = input<boolean>(true);

	// Define output using the `output` function
	public valueChange = output<string>();
	public inputFocused = false;

	public value = '';
	public error?: string;

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
	 * Handles the input event and updates the component's value.
	 * @param {Event} event - The input event.
	 */
	public onInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		this.value = input.value;
		this.onChange(this.value);
		this.valueChange.emit(this.value);
	}
	/**
	 * Checks if the input field is filled.
	 * @returns {boolean} - True if the input field has a value, otherwise false.
	 */
	public isFilled(): boolean {
		return this.value.length > 0;
	}
	/**
	 * Handles the focus event on the input field.
	 */
	public onFocus(): void {
		this.inputFocused = true;
	}

	/**
	 * Handles the blur event on the input field.
	 */
	public onBlur(): void {
		this.inputFocused = false;
		this.onTouched();
	}

	/**
	 * Handles the change event on the input field.
	 * @param {string} $event - The change event.
	 */
	public onChangeValue($event: string): void {
		this.value = $event;
	}

	/**
	 * Registers a callback function to be called when the input value changes.
	 * @internal
	 * @param {any} fn - The callback function.
	 */
	public registerOnChange(fn: (value: string) => void): void {
		this.onChange = fn;
	}

	/**
	 * Registers a callback function to be called when the input is touched.
	 * @internal
	 * @param {any} fn - The callback function.
	 */
	public registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	/**
	 * Writes a new value to the input field.
	 * @internal
	 * @param {string} value - The new value.
	 */
	public writeValue(value: string): void {
		this.value = value;
	}
}
