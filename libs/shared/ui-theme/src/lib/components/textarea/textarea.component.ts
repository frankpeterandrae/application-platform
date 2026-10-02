/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, ElementRef, forwardRef, input, output, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { FloatingLabelDirective } from '../../directives/floating-lable';

/**
 * Reusable textarea that integrates with Angular forms.
 */
@Component({
	selector: 'theme-textarea',
	imports: [CommonModule, FloatingLabelDirective],
	templateUrl: './textarea.component.html',
	styleUrl: './textarea.component.scss',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => TextareaComponent),
			multi: true
		}
	]
})
export class TextareaComponent implements ControlValueAccessor {
	/** Optional id for the input element. */
	public id = input<string>('');
	/** Reference to the input element. */
	public readonly textareaElement = viewChild.required<ElementRef>('textarea');
	public label = input<string>('');
	public placeholder = input<string>('');
	public isDynamic = input<boolean>(true);
	/** When true, applies dark text color for light backgrounds. */
	public darkText = input<boolean>(false);
	public disabled = input<boolean>(false);

	// Define output using the `output` function
	public valueChange = output<string>();
	public textareaFocused = false;

	public readonly value = signal('');
	public error?: string;

	public readonly formDisabled = signal(false);

	private onChange: (value: string) => void = () => undefined;
	private onTouched: () => void = () => undefined;

	/**
	 * Handles native textarea changes.
	 *
	 * @param event The textarea input event.
	 * @returns Nothing.
	 */
	public onInput(event: Event): void {
		const textarea = event.target as HTMLTextAreaElement;

		this.value.set(textarea.value);
		this.onChange(textarea.value);
		this.valueChange.emit(textarea.value);
	}

	/**
	 * Indicates whether the textarea should be treated as filled.
	 *
	 * @returns `true` when a value or placeholder is present.
	 */
	public isFilled(): boolean {
		return this.value().length > 0 || !!this.placeholder();
	}
	/**
	 * Handles the focus event on the textarea field.
	 */
	public onFocus(): void {
		this.textareaFocused = true;
	}

	/**
	 * Handles the blur event on the textarea field.
	 */
	public onBlur(): void {
		this.textareaFocused = false;
		this.onTouched();
	}

	/**
	 * Registers a callback function to be called when the textarea value changes.
	 * @internal
	 * @param {(value: string) => void} fn - The callback function.
	 */
	public registerOnChange(fn: (value: string) => void): void {
		this.onChange = fn;
	}

	/**
	 * Registers a callback function to be called when the textarea is touched.
	 * @internal
	 * @param {() => void} fn - The callback function.
	 */
	public registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	/**
	 * Writes a new value to the textarea field.
	 * @internal
	 * @param {string} value - The new value.
	 */
	public writeValue(value: string | null | undefined): void {
		this.value.set(value ?? '');
	}

	/**
	 * Indicates whether the floating label should be active.
	 *
	 * @returns `true` when dynamic labels are enabled and the textarea has focus.
	 */
	protected isFloating(): boolean {
		return this.isDynamic() && this.textareaFocused;
	}

	/**
	 * Sets the disabled state of the textarea field.
	 *
	 * @internal
	 * @param {boolean} isDisabled - The disabled state.
	 */
	public setDisabledState(isDisabled: boolean): void {
		this.formDisabled.set(isDisabled);
	}
}
