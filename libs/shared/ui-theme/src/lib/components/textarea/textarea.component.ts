import { Component, ElementRef, forwardRef, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FloatingLabelDirective } from '../../directives/floating-lable';

/**
 * TextareaComponent is a custom Angular component that provides a reusable textarea input field.
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

	// Define output using the `output` function
	public valueChange = output<string>();
	public textareaFocused = false;

	public value = '';
	public error?: string;
	/**
	 * Callback function to handle changes in the textarea value.
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public onChange: (value: string) => void = () => {};
	/**
	 * Callback function to handle touch events on the textarea.
	 */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public onTouched: () => void = () => {};

	/**
	 * Handles the textarea event and updates the component's value.
	 * @param {Event} event - The textarea event.
	 */
	public onInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		this.value = input.value;
		this.onChange(this.value);
		this.valueChange.emit(this.value);
	}
	/**
	 * Checks if the textarea field is filled.
	 * @returns {boolean} - True if the textarea field has a value, otherwise false.
	 */
	public isFilled(): boolean {
		return this.value.length > 0;
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
	 * Handles the change event on the textarea field.
	 * @param {string} $event - The change event.
	 */
	public onChangeValue($event: string): void {
		this.value = $event;
	}

	/**
	 * Registers a callback function to be called when the textarea value changes.
	 * @internal
	 * @param {any} fn - The callback function.
	 */
	public registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	/**
	 * Registers a callback function to be called when the textarea is touched.
	 * @internal
	 * @param {any} fn - The callback function.
	 */
	public registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	/**
	 * Writes a new value to the textarea field.
	 * @internal
	 * @param {string} value - The new value.
	 */
	public writeValue(value: string): void {
		this.value = value;
	}

	/**
	 * Sets the disabled state of the textarea field.
	 * @returns {boolean} - The disabled state.
	 */
	protected isFloating(): boolean {
		return this.isDynamic() && this.textareaFocused;
	}
}
