/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { InputComponent } from './input.component';

describe('InputComponent', () => {
	let component: InputComponent;
	let fixture: ComponentFixture<InputComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [InputComponent]
		});

		fixture = TestBed.createComponent(InputComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('label', 'value');

		fixture.detectChanges();
	});

	it('should update the value and notify consumers on input', () => {
		const onChange = vi.fn();
		const valueChangeSpy = vi.spyOn(component.valueChange, 'emit');

		component.registerOnChange(onChange);

		const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

		input.value = 'new value';
		input.dispatchEvent(new Event('input'));

		expect(component.value()).toBe('new value');
		expect(onChange).toHaveBeenCalledWith('new value');
		expect(valueChangeSpy).toHaveBeenCalledWith('new value');
	});

	it('should return true if input field is filled', () => {
		component.value.set('filled');
		expect(component.isFilled()).toBe(true);
	});

	it('should return false if input field is empty', () => {
		component.value.set('');
		expect(component.isFilled()).toBe(false);
	});

	it('should set inputFocused to true on focus event', () => {
		component.onFocus();
		expect(component.inputFocused).toBe(true);
	});

	it('should render a value written by the form without user interaction', () => {
		component.writeValue('written value');

		fixture.detectChanges();

		const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

		expect(input.value).toBe('written value');
	});

	it('should clear the rendered value when writeValue receives null', () => {
		component.writeValue('initial');
		fixture.detectChanges();

		component.writeValue(null);
		fixture.detectChanges();

		const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

		expect(component.value()).toBe('');
		expect(input.value).toBe('');
	});

	it('should mark the control as touched on blur', () => {
		const onTouched = vi.fn();

		component.registerOnTouched(onTouched);
		component.onFocus();
		component.onBlur();

		expect(component.inputFocused).toBe(false);
		expect(onTouched).toHaveBeenCalledOnce();
	});

	it('should disable the native input through the CVA', () => {
		component.setDisabledState(true);

		fixture.detectChanges();

		const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

		expect(component.formDisabled()).toBe(true);
		expect(input.disabled).toBe(true);
	});

	it('should disable the native input through the component input', () => {
		fixture.componentRef.setInput('disabled', true);

		fixture.detectChanges();

		const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

		expect(input.disabled).toBe(true);
	});
});
