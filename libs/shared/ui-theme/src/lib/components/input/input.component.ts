/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import type { ElementRef } from '@angular/core';
import { Component, forwardRef, input, output, signal, viewChild } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

import { FloatingLabelDirective } from '../../directives/floating-lable';
import { IconDefinition } from '../../enums';

/**
 * Reusable text/number input that integrates with Angular forms.
 */
@Component({
	selector: 'theme-input',
	imports: [CommonModule, FastSvgComponent, FloatingLabelDirective],
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
	public readonly id = input<string>('');
	public readonly inputElement = viewChild.required<ElementRef<HTMLInputElement>>('input');
	public readonly label = input.required<string>();
	public readonly type = input<string>('text');
	public readonly placeholder = input<string>('');
	public readonly icon = input<IconDefinition>(IconDefinition.NONE);
	public readonly isDynamic = input<boolean>(true);
	public readonly darkText = input<boolean>(false);
	public readonly disabled = input<boolean>(false);
	public readonly step = input<number>(1);
	public readonly min = input<number | null>(null);
	public readonly max = input<number | null>(null);

	public readonly valueChange = output<string>();

	public readonly value = signal<string | number>('');
	public readonly formDisabled = signal(false);

	public inputFocused = false;
	public error?: string;

	private onChange: (value: string) => void = () => undefined;
	private onTouched: () => void = () => undefined;

	/**
	 * Handles native input changes.
	 *
	 * @param event The input event.
	 * @returns Nothing.
	 */
	public onInput(event: Event): void {
		const input = event.target as HTMLInputElement;

		this.value.set(input.value);
		this.onChange(input.value);
		this.valueChange.emit(input.value);
	}

	/**
	 * Indicates whether the input should be treated as filled.
	 *
	 * @returns `true` when a value or placeholder is present.
	 */
	public isFilled(): boolean {
		return String(this.value()).length > 0 || !!this.placeholder();
	}

	/**
	 * Handles the focus event on the input field.
	 */
	public onFocus(): void {
		this.inputFocused = true;
	}

	/**
	 * Handles the blur event on the textarea field.
	 */
	public onBlur(): void {
		this.inputFocused = false;
		this.onTouched();
	}

	/**
	 * Registers the Angular forms change callback.
	 *
	 * @param fn Callback invoked when the value changes.
	 * @returns Nothing.
	 */
	public registerOnChange(fn: (value: string) => void): void {
		this.onChange = fn;
	}

	/**
	 * Registers the Angular forms touched callback.
	 *
	 * @param fn Callback invoked when the control is touched.
	 * @returns Nothing.
	 */
	public registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	/**
	 * Writes a value from Angular forms to the input.
	 *
	 * @param value The value to render.
	 * @returns Nothing.
	 */
	public writeValue(value: string | number | null | undefined): void {
		this.value.set(value ?? '');
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

	/**
	 * Indicates whether the floating label should be active.
	 *
	 * @returns `true` when dynamic labels are enabled and the input has focus.
	 */
	protected isFloating(): boolean {
		return this.isDynamic() && this.inputFocused;
	}
}
