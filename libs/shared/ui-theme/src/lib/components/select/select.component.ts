import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FloatingLabelDirective } from '../../directives/floating-lable';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

export interface SelectOption {
	label: string;
	value: any;
}

/**
 * SelectComponent is a custom Angular component that implements ControlValueAccessor
 * to provide a reusable dropdown (single or multi-select).
 */
@Component({
	selector: 'theme-select',
	imports: [CommonModule, FormsModule, ReactiveFormsModule, FloatingLabelDirective, FastSvgComponent],
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
export class SelectComponent implements ControlValueAccessor {
	/** Unique id for the select element. */
	public id = input<string>('');
	/** Label displayed above select. */
	public label = input<string>('');
	/** List of options to render. */
	public options = input<SelectOption[]>([]);
	/** Placeholder when no selection. */
	public emptySelection = input<boolean>(true);
	/** Enable multiple selection. */
	public multiple = input<boolean>(false);
	public isDynamic = input<boolean>(true);
	/** When true, applies dark text color for light backgrounds. */
	public darkText = input<boolean>(false);

	/** Current selected value(s). */
	public value: any;
	public selectFocused = false;

	/**
	 * Callback when value changes.
	 * @internal
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private onChange: (value: any) => void = () => {};

	/**
	 * Callback when control is touched.
	 * @internal
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	protected onTouched: () => void = () => {};

	/**
	 * Handles the focus event on the input field.
	 */
	protected onFocus(): void {
		this.selectFocused = true;
	}

	/**
	 * Handles the blur event on the select field.
	 */
	public onBlur(): void {
		this.selectFocused = false;
		this.onTouched();
	}
	/**
	 * Writes a new value to the select component.
	 * @param {any} value - The value to set.
	 */
	public writeValue(value: any): void {
		this.value = value;
	}

	/**
	 * Registers a callback function that should be called when the value changes.
	 * @param {any} fn - The change callback.
	 */
	public registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	/**
	 * Registers a callback function that should be called when the control is touched.
	 * @param {any} fn - The touch callback.
	 */
	public registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	/**
	 * Handles change event from the native select element.
	 * @param {Event} event - The change event.
	 */
	public onSelectChange(event: Event): void {
		const select = event.target as HTMLSelectElement;
		const selected = Array.from(select.selectedOptions).map((o) => o.value);
		this.value = this.multiple() ? selected : selected[0];
		this.onChange(this.value);
		this.onTouched();
	}

	/**
	 * Checks if the input field is filled.
	 * @returns {boolean} - True if the input field has a value, otherwise false.
	 */
	public isFilled(): boolean {
		return this.value.length > 0;
	}

	/**
	 * Sets the disabled state of the select field.
	 * @returns {boolean} - The disabled state.
	 */
	protected isFloating(): boolean {
		return this.isDynamic() && this.selectFocused;
	}
}
