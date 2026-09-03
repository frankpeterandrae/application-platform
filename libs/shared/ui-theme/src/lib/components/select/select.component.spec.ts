/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { SelectComponent } from './select.component';

describe('SelectComponent', () => {
	let fixture: ComponentFixture<SelectComponent<string>>;
	let component: SelectComponent<string>;

	const options = [
		{ label: 'Red', value: 'red' },
		{ label: 'Green', value: 'green' },
		{ label: 'Blue', value: 'blue' }
	];

	beforeEach(async () => {
		await setupTestingModule({
			imports: [SelectComponent]
		});

		fixture = TestBed.createComponent<SelectComponent<string>>(SelectComponent);

		component = fixture.componentInstance;

		fixture.componentRef.setInput('options', options);

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have default input values', () => {
		expect(component.id()).toBe('');
		expect(component.label()).toBe('');
		expect(component.emptySelection()).toBe(true);
		expect(component.multiple()).toBe(false);
		expect(component.isDynamic()).toBe(true);
		expect(component.darkText()).toBe(false);
	});

	it('should initialize closed and enabled', () => {
		expect(component.open()).toBe(false);
		expect(component.formDisabled()).toBe(false);
		expect(component.selectFocused()).toBe(false);
	});

	describe('writeValue', () => {
		it('should write a single value', () => {
			component.writeValue('red');

			expect(component.value()).toBe('red');
		});

		it('should write multiple values in multiple mode', () => {
			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component.writeValue(['red', 'blue']);

			expect(component.value()).toEqual(['red', 'blue']);
		});

		it('should use an empty array when multiple mode receives no array', () => {
			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component.writeValue(undefined);

			expect(component.value()).toEqual([]);
		});
	});

	describe('displayValue', () => {
		it('should display the label of a single selected value', () => {
			component.writeValue('green');

			expect(component['displayValue']()).toBe('Green');
		});

		it('should display labels of multiple selected values', () => {
			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component.writeValue(['red', 'blue']);

			expect(component['displayValue']()).toBe('Red, Blue');
		});

		it('should display an empty string without selection', () => {
			expect(component['displayValue']()).toBe('');
		});
	});

	describe('toggle', () => {
		it('should open and close the select', () => {
			component['toggle']();

			expect(component.open()).toBe(true);

			component['toggle']();

			expect(component.open()).toBe(false);
		});

		it('should not open when disabled', () => {
			component.setDisabledState(true);

			component['toggle']();

			expect(component.open()).toBe(false);
		});
	});

	describe('selectOption', () => {
		it('should select a value and close in single mode', () => {
			const onChange = vi.fn();

			component.registerOnChange(onChange);

			component['toggle']();
			component['selectOption']('green');

			expect(component.value()).toBe('green');
			expect(component.open()).toBe(false);
			expect(onChange).toHaveBeenCalledWith('green');
		});

		it('should add a value in multiple mode', () => {
			const onChange = vi.fn();

			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component.registerOnChange(onChange);

			component.writeValue(['red']);

			component['selectOption']('blue');

			expect(component.value()).toEqual(['red', 'blue']);

			expect(onChange).toHaveBeenCalledWith(['red', 'blue']);
		});

		it('should remove an already selected value in multiple mode', () => {
			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component.writeValue(['red', 'blue']);

			component['selectOption']('red');

			expect(component.value()).toEqual(['blue']);
		});

		it('should keep the select open in multiple mode', () => {
			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component['toggle']();
			component['selectOption']('red');

			expect(component.open()).toBe(true);
		});

		it('should ignore selection when disabled', () => {
			component.setDisabledState(true);

			component['selectOption']('red');

			expect(component.value()).toBeUndefined();
		});
	});

	describe('clearSelection', () => {
		it('should clear a single selection', () => {
			const onChange = vi.fn();

			component.registerOnChange(onChange);

			component.writeValue('red');

			component['toggle']();
			component['clearSelection']();

			expect(component.value()).toBeUndefined();
			expect(component.open()).toBe(false);
			expect(onChange).toHaveBeenCalledWith(undefined);
		});

		it('should not clear values in multiple mode', () => {
			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component.writeValue(['red']);

			component['clearSelection']();

			expect(component.value()).toEqual(['red']);
		});
	});

	describe('isSelected', () => {
		it('should detect a selected single value', () => {
			component.writeValue('green');

			expect(component['isSelected']('green')).toBe(true);

			expect(component['isSelected']('red')).toBe(false);
		});

		it('should detect selected values in multiple mode', () => {
			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component.writeValue(['red', 'blue']);

			expect(component['isSelected']('blue')).toBe(true);

			expect(component['isSelected']('green')).toBe(false);
		});
	});

	describe('isFilled', () => {
		it('should return false without selection', () => {
			expect(component['isFilled']()).toBe(false);
		});

		it('should return true for a single value', () => {
			component.writeValue('red');

			expect(component['isFilled']()).toBe(true);
		});

		it('should return false for an empty multiple value', () => {
			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component.writeValue([]);

			expect(component['isFilled']()).toBe(false);
		});

		it('should return true for multiple values', () => {
			fixture.componentRef.setInput('multiple', true);

			fixture.detectChanges();

			component.writeValue(['red']);

			expect(component['isFilled']()).toBe(true);
		});
	});

	describe('floating state', () => {
		it('should float while open', () => {
			component.open.set(true);

			expect(component['isFloating']()).toBe(true);
		});

		it('should float while focused', () => {
			component['onFocus']();

			expect(component['isFloating']()).toBe(true);
		});

		it('should float when a value is selected', () => {
			component.writeValue('red');

			expect(component['isFloating']()).toBe(true);
		});

		it('should not float when empty, closed and unfocused', () => {
			expect(component['isFloating']()).toBe(false);
		});
	});

	describe('focus', () => {
		it('should set focused state', () => {
			component['onFocus']();

			expect(component.selectFocused()).toBe(true);
		});

		it('should clear focused state', () => {
			component.selectFocused.set(true);

			component['onBlur']();

			expect(component.selectFocused()).toBe(false);
		});
	});

	describe('disabled state', () => {
		it('should disable the control', () => {
			component.setDisabledState(true);

			expect(component.formDisabled()).toBe(true);
		});

		it('should close the select when disabled', () => {
			component.open.set(true);

			component.setDisabledState(true);

			expect(component.open()).toBe(false);
		});
	});

	describe('ControlValueAccessor callbacks', () => {
		it('should register onChange callback', () => {
			const onChange = vi.fn();

			component.registerOnChange(onChange);

			component['selectOption']('red');

			expect(onChange).toHaveBeenCalledWith('red');
		});

		it('should call onTouched on blur', () => {
			const onTouched = vi.fn();

			component.registerOnTouched(onTouched);

			component['onBlur']();

			expect(onTouched).toHaveBeenCalledOnce();
		});

		it('should not call onTouched when closing', () => {
			const onTouched = vi.fn();

			component.registerOnTouched(onTouched);
			component.open.set(true);

			component['close']();

			expect(onTouched).not.toHaveBeenCalled();
		});

		it('should not activate an option when opening an empty select', () => {
			fixture.componentRef.setInput('options', []);
			fixture.componentRef.setInput('emptySelection', false);
			fixture.detectChanges();

			component['toggle']();

			expect(component.open()).toBe(true);
			expect(component['activeIndex']()).toBeNull();
		});

		it('should ignore an invalid active option index', () => {
			const onChange = vi.fn();

			component.registerOnChange(onChange);
			component['activeIndex'].set(99);

			component['onTriggerKeydown'](
				new KeyboardEvent('keydown', {
					key: 'Enter',
					cancelable: true
				})
			);

			expect(onChange).not.toHaveBeenCalled();
			expect(component.value()).toBeUndefined();
		});
	});

	describe('keyboard navigation', () => {
		const keydown = (key: string): KeyboardEvent => {
			const event = new KeyboardEvent('keydown', {
				key,
				cancelable: true
			});

			component['onTriggerKeydown'](event);

			return event;
		};

		it.each([
			['ArrowDown', 0, 1],
			['ArrowUp', 0, 0],
			['End', 0, 3],
			['ArrowUp', 2, 1],
			['ArrowDown', 3, 3],
			['Home', 2, 0]
		])('should navigate with %s from index %i to index %i', (key, startIndex, expectedIndex) => {
			component['toggle']();
			component['setActiveOption'](startIndex);

			keydown(key);

			expect(component['activeIndex']()).toBe(expectedIndex);
		});

		it('should select the active option with Enter', () => {
			const onChange = vi.fn();

			component.registerOnChange(onChange);
			component['toggle']();
			component['setActiveOption'](2);

			keydown('Enter');

			expect(component.value()).toBe('green');
			expect(onChange).toHaveBeenCalledWith('green');
			expect(component.open()).toBe(false);
		});

		it('should select the active option with Space', () => {
			component['toggle']();
			component['setActiveOption'](1);

			keydown(' ');

			expect(component.value()).toBe('red');
		});

		it('should clear the selection when the empty option is active', () => {
			const onChange = vi.fn();

			component.registerOnChange(onChange);
			component.writeValue('red');
			component['toggle']();
			component['setActiveOption'](0);

			keydown('Enter');

			expect(component.value()).toBeUndefined();
			expect(onChange).toHaveBeenCalledWith(undefined);
		});

		it('should close with Escape without changing the value', () => {
			const onChange = vi.fn();

			component.registerOnChange(onChange);
			component.writeValue('green');
			component['toggle']();

			keydown('Escape');

			expect(component.open()).toBe(false);
			expect(component.value()).toBe('green');
			expect(onChange).not.toHaveBeenCalled();
		});

		it('should close with Tab without preventing the default action', () => {
			component['toggle']();

			const event = keydown('Tab');

			expect(component.open()).toBe(false);
			expect(event.defaultPrevented).toBe(false);
		});

		it('should ignore keyboard interaction while disabled', () => {
			component.setDisabledState(true);

			keydown('ArrowDown');

			expect(component.open()).toBe(false);
		});
	});

	describe('multiple keyboard selection', () => {
		it('should select an option and keep the list open', () => {
			const onChange = vi.fn();

			fixture.componentRef.setInput('multiple', true);
			fixture.detectChanges();

			component.registerOnChange(onChange);
			component['toggle']();
			component['setActiveOption'](1);

			component['onTriggerKeydown'](
				new KeyboardEvent('keydown', {
					key: 'Enter',
					cancelable: true
				})
			);

			expect(component.value()).toEqual(['green']);
			expect(onChange).toHaveBeenCalledWith(['green']);
			expect(component.open()).toBe(true);
		});

		it('should deselect an active option', () => {
			fixture.componentRef.setInput('multiple', true);
			fixture.detectChanges();

			component.writeValue(['green']);
			component['toggle']();
			component['setActiveOption'](1);

			component['onTriggerKeydown'](
				new KeyboardEvent('keydown', {
					key: 'Enter',
					cancelable: true
				})
			);

			expect(component.value()).toEqual([]);
		});
	});

	describe('accessibility', () => {
		it('should render the trigger as a combobox', () => {
			const trigger = fixture.nativeElement.querySelector('.fpa-select') as HTMLButtonElement;

			expect(trigger.getAttribute('role')).toBe('combobox');
			expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
			expect(trigger.getAttribute('aria-expanded')).toBe('false');
		});

		it('should associate the combobox with its listbox', () => {
			const trigger = fixture.nativeElement.querySelector('.fpa-select') as HTMLButtonElement;

			expect(trigger.getAttribute('aria-controls')).toBe(`${trigger.id}-listbox`);
		});

		it('should update aria-expanded when opened', () => {
			component['toggle']();
			fixture.detectChanges();

			const trigger = fixture.nativeElement.querySelector('.fpa-select') as HTMLButtonElement;

			expect(trigger.getAttribute('aria-expanded')).toBe('true');
		});

		it('should set aria-activedescendant while open', () => {
			component['toggle']();
			fixture.detectChanges();

			const trigger = fixture.nativeElement.querySelector('.fpa-select') as HTMLButtonElement;

			expect(trigger.getAttribute('aria-activedescendant')).toBe(`${trigger.id}-listbox-option-0`);
		});

		it('should remove aria-activedescendant when closed', () => {
			component['toggle']();
			component['close']();

			fixture.detectChanges();

			const trigger = fixture.nativeElement.querySelector('.fpa-select') as HTMLButtonElement;

			expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
		});

		it('should render listbox options with ARIA semantics', () => {
			component['toggle']();
			fixture.detectChanges();

			const listbox = document.querySelector('[role="listbox"]');
			const renderedOptions = Array.from(document.querySelectorAll('[role="option"]'));

			expect(listbox).not.toBeNull();
			expect(renderedOptions).toHaveLength(4);

			expect(renderedOptions[0].getAttribute('aria-selected')).toBe('true');
			expect(renderedOptions[1].getAttribute('aria-selected')).toBe('false');
		});

		it('should mark a multiple listbox as multiselectable', () => {
			fixture.componentRef.setInput('multiple', true);
			fixture.detectChanges();

			component['toggle']();
			fixture.detectChanges();

			const listbox = document.querySelector('[role="listbox"]');

			expect(listbox?.getAttribute('aria-multiselectable')).toBe('true');
		});
	});
});
