/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, ElementRef, forwardRef, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { IconDefinition } from '../../enums';
import { FloatingLabelDirective } from '../../directives/floating-lable';

/**
 * InputComponent is a custom Angular component that implements ControlValueAccessor
 * to provide a reusable input field with various configurable properties.
 */
@Component({
	selector: 'theme-input',
	imports: [CommonModule, FastSvgComponent, FloatingLabelDirective, FormsModule, ReactiveFormsModule],
	templateUrl: './input.component.html',
	styleUrls: ['./input.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => InputComponent),
			multi: true
		}
	]
})
export class InputComponent implements ControlValueAccessor {
	/** Optional id for the input element. */
	public id = input<string>('');
	/** Reference to the input element. */
	public readonly inputElement = viewChild.required<ElementRef>('input');
	public label = input.required<string>();
	public type = input<string>('text');
	public placeholder = input<string>('');
	public icon = input<IconDefinition>(IconDefinition.NONE);
	public isDynamic = input<boolean>(true);
	/** When true, applies dark text color for light backgrounds. */
	public darkText = input<boolean>(false);
	public disabled = input<boolean>(false);

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

	/**
	 * Writes a new value to the input field.
	 * @internal
	 * @param {string} value - The new value.
	 */
	public writeValue(value: string): void {
		this.value = value;
	}

	/**
	 * Sets the disabled state of the input field.
	 * @returns {boolean} - The disabled state.
	 */
	protected isFloating(): boolean {
		return this.isDynamic() && this.inputFocused;
	}
}
