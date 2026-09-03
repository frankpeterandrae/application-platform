/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, forwardRef, input, output, signal } from '@angular/core';
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
	public readonly label = input<string>('');
	public readonly checkboxes = input<CheckboxConfig[]>([]);

	public readonly changeCheckbox = output<CheckboxConfig>();

	protected readonly disabled = signal(false);
	protected readonly value = signal<string[] | null>(null);

	private propagateChange: (value: string[]) => void = () => {
		/* empty */
	};
	private propagateTouch: () => void = () => {
		/* empty */
	};

	/**
	 * Writes a new value to the component.
	 * This method is called by the Angular forms API to update the model value.
	 * @param {string[]} value - The new value to write.
	 */
	public writeValue(value: string[] | null | undefined): void {
		this.value.set(value ? [...value] : []);
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
		this.disabled.set(isDisabled);
	}

	protected isChecked(value: string): boolean {
		const currentValue = this.value();

		if (currentValue === null) {
			return this.checkboxes().some((checkbox) => checkbox.value === value && checkbox.checked);
		}

		return currentValue.includes(value);
	}

	/**
	 * Handles the change event when a checkbox is checked or unchecked.
	 * Updates the value and emits the change event.
	 * @param {Event} $event - The event object containing the checkbox state and value.
	 * @param {CheckboxConfig} checkbox - The checkbox configuration object.
	 */
	protected onCheckChange(event: Event, checkbox: CheckboxConfig): void {
		const target = event.target as HTMLInputElement;
		const currentValue = this.currentValue();

		const nextValue = target.checked ? [...currentValue, checkbox.value] : currentValue.filter((value) => value !== checkbox.value);

		this.value.set(nextValue);
		this.propagateChange(nextValue);

		this.changeCheckbox.emit({
			...checkbox,
			checked: target.checked
		});
	}

	private currentValue(): string[] {
		return (
			this.value() ??
			this.checkboxes()
				.filter((checkbox) => checkbox.checked)
				.map((checkbox) => checkbox.value)
		);
	}

	protected onBlur(): void {
		this.propagateTouch();
	}
}
