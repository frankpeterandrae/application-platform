/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { CheckboxGroupComponent } from './checkbox-group.component';

describe('CheckboxGroupComponent', () => {
	let component: CheckboxGroupComponent;
	let fixture: ComponentFixture<CheckboxGroupComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [CheckboxGroupComponent]
		});

		fixture = TestBed.createComponent(CheckboxGroupComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should initialize its value from checked checkbox configuration', () => {
		fixture.componentRef.setInput('checkboxes', [
			{ id: 'a', label: 'A', value: 'a', checked: true },
			{ id: 'b', label: 'B', value: 'b', checked: false }
		]);

		fixture.detectChanges();

		const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];

		expect(inputs[0].checked).toBe(true);
		expect(inputs[1].checked).toBe(false);
	});

	it('should let writeValue override the configured checked state', () => {
		fixture.componentRef.setInput('checkboxes', [
			{ id: 'a', label: 'A', value: 'a', checked: true },
			{ id: 'b', label: 'B', value: 'b', checked: false }
		]);

		fixture.detectChanges();

		component.writeValue(['b']);
		fixture.detectChanges();

		const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];

		expect(inputs[0].checked).toBe(false);
		expect(inputs[1].checked).toBe(true);
	});

	it('updates value and emits when a checkbox is checked', () => {
		const checkboxes = [{ id: 'a', label: 'A', value: 'a', checked: false }];
		fixture.componentRef.setInput('checkboxes', checkboxes);
		fixture.detectChanges();

		const onChange = vi.fn();
		const emitSpy = vi.spyOn(component.changeCheckbox, 'emit');
		component.registerOnChange(onChange);

		(component as unknown as { onCheckChange: (e: Event, c: unknown) => void }).onCheckChange(
			{ target: { checked: true, value: 'a' } } as unknown as Event,
			checkboxes[0]
		);

		expect(onChange).toHaveBeenCalledWith(['a']);
		expect(emitSpy).toHaveBeenCalledWith({ ...checkboxes[0], checked: true });
	});

	it('removes value when a checkbox is unchecked', () => {
		const checkboxes = [{ id: 'a', label: 'A', value: 'a', checked: true }];
		fixture.componentRef.setInput('checkboxes', checkboxes);
		fixture.detectChanges();

		const onChange = vi.fn();
		component.registerOnChange(onChange);

		(component as unknown as { onCheckChange: (e: Event, c: unknown) => void }).onCheckChange(
			{ target: { checked: false, value: 'a' } } as unknown as Event,
			checkboxes[0]
		);

		expect(onChange).toHaveBeenCalledWith([]);
	});

	it('should disable all checkboxes through setDisabledState', () => {
		fixture.componentRef.setInput('checkboxes', [
			{ id: 'a', label: 'A', value: 'a', checked: false },
			{ id: 'b', label: 'B', value: 'b', checked: false }
		]);

		component.setDisabledState(true);
		fixture.detectChanges();

		const inputs = Array.from(fixture.nativeElement.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];

		expect(inputs).toHaveLength(2);
		expect(inputs.every((input) => input.disabled)).toBe(true);
	});

	it('should render values written by the form', () => {
		const checkboxes = [
			{ id: 'a', label: 'A', value: 'a', checked: false },
			{ id: 'b', label: 'B', value: 'b', checked: false }
		];

		fixture.componentRef.setInput('checkboxes', checkboxes);
		fixture.detectChanges();

		component.writeValue(['b']);
		fixture.detectChanges();

		const inputs = Array.from(fixture.nativeElement.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];

		expect(inputs[0].checked).toBe(false);
		expect(inputs[1].checked).toBe(true);
	});

	it('should propagate a checked value', () => {
		const onChange = vi.fn();

		const checkboxes = [{ id: 'a', label: 'A', value: 'a', checked: false }];

		fixture.componentRef.setInput('checkboxes', checkboxes);
		fixture.detectChanges();

		component.registerOnChange(onChange);

		const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

		input.checked = true;
		input.dispatchEvent(new Event('change'));

		expect(component['value']()).toEqual(['a']);
		expect(onChange).toHaveBeenCalledWith(['a']);
	});

	it('should propagate an unchecked value', () => {
		const onChange = vi.fn();

		const checkboxes = [{ id: 'a', label: 'A', value: 'a', checked: true }];

		fixture.componentRef.setInput('checkboxes', checkboxes);
		fixture.detectChanges();

		component.registerOnChange(onChange);

		const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

		input.checked = false;
		input.dispatchEvent(new Event('change'));

		expect(component['value']()).toEqual([]);
		expect(onChange).toHaveBeenCalledWith([]);
	});

	it('should mark the control as touched on blur', () => {
		const onTouched = vi.fn();

		fixture.componentRef.setInput('checkboxes', [{ id: 'a', label: 'A', value: 'a', checked: false }]);
		fixture.detectChanges();

		component.registerOnTouched(onTouched);

		const input = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;

		input.dispatchEvent(new Event('blur'));

		expect(onTouched).toHaveBeenCalledOnce();
	});

	it('should disable all checkboxes through the CVA', () => {
		const checkboxes = [
			{ id: 'a', label: 'A', value: 'a', checked: false },
			{ id: 'b', label: 'B', value: 'b', checked: false }
		];

		fixture.componentRef.setInput('checkboxes', checkboxes);
		component.setDisabledState(true);

		fixture.detectChanges();

		const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];

		expect(inputs.every((input) => input.disabled)).toBe(true);
	});
});
