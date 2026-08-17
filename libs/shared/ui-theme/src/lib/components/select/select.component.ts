/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

import { FloatingLabelDirective } from '../../directives/floating-lable';
import { IconDefinition } from '../../enums';

export interface SelectOption<T = unknown> {
	label: string;
	value: T;
}

/**
 * Type alias for the select component value (single, multiple, or undefined).
 */
export type SelectValue<T = unknown> = T | T[] | undefined;

/**
 * SelectComponent is a custom Angular component that implements ControlValueAccessor
 * to provide a reusable dropdown (single or multi-select).
 */
@Component({
	selector: 'theme-select',
	imports: [OverlayModule, FloatingLabelDirective, FastSvgComponent],
	templateUrl: './select.component.html',
	styleUrls: ['./select.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => SelectComponent),
			multi: true
		}
	]
})
export class SelectComponent<T = unknown> implements ControlValueAccessor {
	public readonly id = input<string>('');
	public readonly label = input<string>('');
	public readonly options = input<SelectOption<T>[]>([]);
	public readonly emptySelection = input<boolean>(true);
	public readonly multiple = input<boolean>(false);
	public readonly isDynamic = input<boolean>(true);
	public readonly darkText = input<boolean>(false);

	public readonly value = signal<SelectValue<T>>(undefined);

	public readonly open = signal(false);
	public readonly formDisabled = signal(false);
	public readonly selectFocused = signal(false);

	protected readonly IconDefinition = IconDefinition;

	protected readonly positions: ConnectedPosition[] = [
		{
			originX: 'start',
			originY: 'bottom',
			overlayX: 'start',
			overlayY: 'top',
			offsetY: 4
		},
		{
			originX: 'start',
			originY: 'top',
			overlayX: 'start',
			overlayY: 'bottom',
			offsetY: -4
		}
	];

	protected readonly displayValue = computed(() => {
		const current = this.value();
		const options = this.options();

		if (Array.isArray(current)) {
			return options
				.filter((option) => current.includes(option.value))
				.map((option) => option.label)
				.join(', ');
		}

		return options.find((option) => option.value === current)?.label ?? '';
	});

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private onChange: (value: SelectValue<T>) => void = () => {};

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private onTouched: () => void = () => {};

	/**
	 * Writes a new value to the select component.
	 * @param {(value:  SelectValue<T>) => void} fn - The new value to be written (single, multiple, or undefined).
	 */
	public writeValue(value: SelectValue<T>): void {
		if (this.multiple()) {
			this.value.set(Array.isArray(value) ? [...value] : []);

			return;
		}

		this.value.set(value);
	}

	/**
	 * Registers a callback function that should be called when the value changes.
	 * @param {(value:  SelectValue<T>) => void} fn - The change callback.
	 */
	public registerOnChange(fn: (value: SelectValue<T>) => void): void {
		this.onChange = fn;
	}

	/**
	 * Registers a callback function that should be called when the control is touched.
	 * @param {() => void} fn - The touch callback.
	 */
	public registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	/**
	 * Sets the disabled state of the select component.
	 * @param {boolean} isDisabled - Whether the component should be disabled.
	 */
	public setDisabledState(isDisabled: boolean): void {
		this.formDisabled.set(isDisabled);

		if (isDisabled) {
			this.close();
		}
	}

	protected toggle(): void {
		if (this.formDisabled()) {
			return;
		}

		this.open.update((open) => !open);
	}

	protected close(): void {
		if (!this.open()) {
			return;
		}

		this.open.set(false);
		this.onTouched();
	}

	protected selectOption(optionValue: T): void {
		if (this.formDisabled()) {
			return;
		}

		if (!this.multiple()) {
			this.value.set(optionValue);
			this.onChange(optionValue);
			this.close();
			return;
		}

		const current = this.value();

		const selected = Array.isArray(current) ? [...current] : [];

		const index = selected.indexOf(optionValue);

		if (index >= 0) {
			selected.splice(index, 1);
		} else {
			selected.push(optionValue);
		}

		this.value.set(selected);
		this.onChange(selected);
	}

	protected clearSelection(): void {
		if (this.formDisabled() || this.multiple()) {
			return;
		}

		this.value.set(undefined);
		this.onChange(undefined);
		this.close();
	}

	protected isSelected(optionValue: T): boolean {
		const current = this.value();

		if (Array.isArray(current)) {
			return current.includes(optionValue);
		}

		return current === optionValue;
	}

	protected isFilled(): boolean {
		const current = this.value();

		return Array.isArray(current) ? current.length > 0 : current !== undefined && current !== null && current !== '';
	}

	protected isFloating(): boolean {
		return this.open() || this.selectFocused() || this.isFilled();
	}

	protected onFocus(): void {
		this.selectFocused.set(true);
	}

	protected onBlur(): void {
		this.selectFocused.set(false);
	}
}
