/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, computed, ElementRef, forwardRef, input, signal, viewChild, viewChildren } from '@angular/core';
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
	protected readonly optionElements = viewChildren<ElementRef<HTMLElement>>('optionElement');

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

	private static nextId = 0;

	private readonly generatedId = `theme-select-${SelectComponent.nextId++}`;

	protected readonly controlId = computed(() => this.id() || this.generatedId);
	protected readonly listboxId = computed(() => `${this.controlId()}-listbox`);

	protected readonly activeIndex = signal<number | null>(null);
	protected readonly selectPanel = viewChild<ElementRef<HTMLElement>>('selectPanel');

	protected readonly activeDescendant = computed(() => {
		const index = this.activeIndex();

		return this.open() && index !== null ? this.optionId(index) : null;
	});

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
	 * @param {(value:  SelectValue<T>) => void} value - The new value to be written (single, multiple, or undefined).
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
		if (this.open()) {
			this.close();
			return;
		}

		this.openSelect();
	}

	private openSelect(preferLast = false): void {
		if (this.formDisabled()) {
			return;
		}

		this.open.set(true);

		const count = this.optionCount();

		if (count === 0) {
			this.activeIndex.set(null);
			return;
		}

		const selectedIndex = this.selectOptionIndex();

		if (selectedIndex !== null) {
			this.setActiveIndex(selectedIndex);
			return;
		}

		this.setActiveIndex(preferLast ? count - 1 : 0);
	}

	private optionCount(): number {
		return this.options().length + (this.hasEmptyOption() ? 1 : 0);
	}

	private hasEmptyOption(): boolean {
		return this.emptySelection() && !this.multiple();
	}

	protected optionId(index: number): string {
		return `${this.listboxId()}-option-${index}`;
	}

	private selectOptionIndex(): number | null {
		const current = this.value();

		if (this.hasEmptyOption() && (current === undefined || current === null || current === '')) {
			return 0;
		}

		const offset = this.hasEmptyOption() ? 1 : 0;

		if (Array.isArray(current)) {
			const selectedIndex = this.options().findIndex((option) => current.includes(option.value));
			return selectedIndex >= 0 ? selectedIndex + offset : null;
		}

		const selectedIndex = this.options().findIndex((option) => option.value === current);
		return selectedIndex >= 0 ? selectedIndex + offset : null;
	}

	protected onTriggerKeydown(event: KeyboardEvent): void {
		if (this.formDisabled()) {
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
				this.handleArrowKey(event, 1);
				break;

			case 'ArrowUp':
				this.handleArrowKey(event, -1);
				break;

			case 'Home':
				this.handleBoundaryKey(event, 'first');
				break;

			case 'End':
				this.handleBoundaryKey(event, 'last');
				break;

			case 'Enter':
			case ' ':
				this.handleSelectionKey(event);
				break;

			case 'Escape':
				this.handleEscapeKey(event);
				break;

			case 'Tab':
				this.close();
				break;
		}
	}

	private handleArrowKey(event: KeyboardEvent, direction: 1 | -1): void {
		event.preventDefault();

		if (!this.open()) {
			this.openSelect(direction === -1);
			return;
		}

		this.moveActiveOption(direction);
	}

	private handleBoundaryKey(event: KeyboardEvent, boundary: 'first' | 'last'): void {
		if (!this.open()) {
			return;
		}

		const count = this.optionCount();

		if (count === 0) {
			return;
		}

		event.preventDefault();
		this.setActiveIndex(boundary === 'first' ? 0 : count - 1);
	}

	private handleSelectionKey(event: KeyboardEvent): void {
		event.preventDefault();

		if (!this.open()) {
			this.openSelect();
			return;
		}

		this.selectActiveOption();
	}

	private handleEscapeKey(event: KeyboardEvent): void {
		if (!this.open()) {
			return;
		}

		event.preventDefault();
		this.close();
	}

	private moveActiveOption(direction: 1 | -1): void {
		const count = this.optionCount();

		if (count === 0) {
			return;
		}

		const current = this.activeIndex() ?? (direction === 1 ? -1 : count);
		const next = Math.max(0, Math.min(current + direction, count - 1));

		this.setActiveIndex(next);
	}

	private selectActiveOption(): void {
		const index = this.activeIndex();

		if (index === null) {
			return;
		}

		if (this.hasEmptyOption() && index === 0) {
			this.clearSelection();
			return;
		}

		const optionIndex = this.hasEmptyOption() ? index - 1 : index;
		const option = this.options()[optionIndex];

		if (!option) {
			return;
		}

		this.selectOption(option.value);
	}

	protected setActiveOption(index: number): void {
		this.activeIndex.set(index);
	}

	private setActiveIndex(index: number): void {
		this.activeIndex.set(index);
		this.scrollActiveOptionIntoView();
	}

	private scrollActiveOptionIntoView(): void {
		const index = this.activeIndex();
		const panel = this.selectPanel()?.nativeElement;
		const option = index !== null ? this.optionElements()[index]?.nativeElement : undefined;

		if (!panel || !option) {
			return;
		}

		const optionTop = option.offsetTop;
		const optionBottom = optionTop + option.offsetHeight;

		if (optionTop < panel.scrollTop) {
			panel.scrollTop = optionTop;
		} else if (optionBottom > panel.scrollTop + panel.clientHeight) {
			panel.scrollTop = optionBottom - panel.clientHeight;
		}
	}

	protected onOverlayAttached(): void {
		this.scrollActiveOptionIntoView();
	}

	protected close(): void {
		if (!this.open()) {
			return;
		}

		this.open.set(false);
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
		this.onTouched();
	}
}
