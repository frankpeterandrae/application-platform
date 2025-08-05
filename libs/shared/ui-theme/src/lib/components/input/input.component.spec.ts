/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';
import { setupTestingModule } from '../../../test-setup';

describe('InputComponent', () => {
	let component: InputComponent;
	let fixture: ComponentFixture<InputComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [InputComponent]
		});

		/* TODO with Angular 20.1
			const testedComponentInput = signal('value');
		fixture = TestBed.createComponent(InputComponent,  {
			bindings: [
				inputBinding('signal-input-name', testedComponentInput)
			]
		});
		 */
		fixture = TestBed.createComponent(InputComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('label', 'value');

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should update value and emit valueChange on input event', () => {
		const valueChangeSpy = jest.spyOn(component.valueChange, 'emit');
		const inputElement = document.createElement('input');
		inputElement.value = 'new value';
		const inputEvent = new Event('input');
		Object.defineProperty(inputEvent, 'target', { value: inputElement });
		component.onInput(inputEvent);
		expect(component.value).toBe('new value');
		expect(valueChangeSpy).toHaveBeenCalledWith('new value');
	});

	it('should return true if input field is filled', () => {
		component.value = 'filled';
		expect(component.isFilled()).toBe(true);
	});

	it('should return false if input field is empty', () => {
		component.value = '';
		expect(component.isFilled()).toBe(false);
	});

	it('should set inputFocused to true on focus event', () => {
		component.onFocus();
		expect(component.inputFocused).toBe(true);
	});

	it('should set inputFocused to false and call onTouched on blur event', () => {
		const onTouchedSpy = jest.spyOn(component, 'onTouched');
		component.onBlur();
		expect(component.inputFocused).toBe(false);
		expect(onTouchedSpy).toHaveBeenCalled();
	});

	it('should update value on change event', () => {
		component.onChangeValue('changed value');
		expect(component.value).toBe('changed value');
	});

	it('should register onChange callback', () => {
		const fn = jest.fn();
		component.registerOnChange(fn);
		component.onChange('new value');
		expect(fn).toHaveBeenCalledWith('new value');
	});

	it('should register onTouched callback', () => {
		const fn = jest.fn();
		component.registerOnTouched(fn);
		component.onTouched();
		expect(fn).toHaveBeenCalled();
	});

	it('should write new value to input field', () => {
		component.writeValue('written value');
		expect(component.value).toBe('written value');
	});
});
