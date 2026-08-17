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

		it('should call onTouched when closing', () => {
			const onTouched = vi.fn();

			component.registerOnTouched(onTouched);

			component.open.set(true);

			component['close']();

			expect(onTouched).toHaveBeenCalled();
		});
	});
});
