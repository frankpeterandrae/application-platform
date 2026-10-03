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

	const checkboxes = [
		{
			id: 'a',
			label: 'Option A',
			value: 'a'
		},
		{
			id: 'b',
			label: 'Option B',
			value: 'b'
		}
	];

	beforeEach(async () => {
		await setupTestingModule({
			imports: [CheckboxGroupComponent]
		});

		fixture = TestBed.createComponent(CheckboxGroupComponent);
		component = fixture.componentInstance;

		fixture.componentRef.setInput('checkboxes', checkboxes);
	});

	function getInputs(): HTMLInputElement[] {
		return Array.from(fixture.nativeElement.querySelectorAll('input[type="checkbox"]'));
	}

	it('should render the configured checkboxes', () => {
		fixture.detectChanges();

		const inputs = getInputs();

		expect(inputs).toHaveLength(2);
		expect(inputs[0].value).toBe('a');
		expect(inputs[1].value).toBe('b');
	});

	it('should render the group label', () => {
		fixture.componentRef.setInput('label', 'Options');
		fixture.detectChanges();

		const legend = fixture.nativeElement.querySelector('legend');

		expect(legend?.textContent?.trim()).toBe('Options');
	});

	it('should use configured checked values as the initial state', () => {
		fixture.componentRef.setInput('checkboxes', [
			{
				id: 'a',
				label: 'Option A',
				value: 'a',
				checked: true
			},
			{
				id: 'b',
				label: 'Option B',
				value: 'b',
				checked: false
			}
		]);

		fixture.detectChanges();

		const inputs = getInputs();

		expect(inputs[0].checked).toBe(true);
		expect(inputs[1].checked).toBe(false);
	});

	it('should render values written by Angular forms', () => {
		component.writeValue(['b']);
		fixture.detectChanges();

		const inputs = getInputs();

		expect(inputs[0].checked).toBe(false);
		expect(inputs[1].checked).toBe(true);
	});

	it('should clear the selection when writeValue receives null', () => {
		component.writeValue(['a', 'b']);
		component.writeValue(null);

		fixture.detectChanges();

		const inputs = getInputs();

		expect(inputs.every((input) => !input.checked)).toBe(true);
	});

	it('should propagate a checked value and emit the changed checkbox', () => {
		const onChange = vi.fn();
		const emitSpy = vi.spyOn(component.changeCheckbox, 'emit');

		component.registerOnChange(onChange);

		fixture.detectChanges();

		const input = getInputs()[0];

		input.checked = true;
		input.dispatchEvent(new Event('change'));

		expect(onChange).toHaveBeenCalledWith(['a']);
		expect(emitSpy).toHaveBeenCalledWith({
			...checkboxes[0],
			checked: true
		});
	});

	it('should remove an unchecked value', () => {
		const onChange = vi.fn();

		component.writeValue(['a', 'b']);
		component.registerOnChange(onChange);

		fixture.detectChanges();

		const input = getInputs()[0];

		input.checked = false;
		input.dispatchEvent(new Event('change'));

		expect(onChange).toHaveBeenCalledWith(['b']);
	});

	it('should mark the control as touched on blur', () => {
		const onTouched = vi.fn();

		component.registerOnTouched(onTouched);
		fixture.detectChanges();

		getInputs()[0].dispatchEvent(new Event('blur'));

		expect(onTouched).toHaveBeenCalledOnce();
	});

	it('should disable all checkboxes through the CVA', () => {
		component.setDisabledState(true);
		fixture.detectChanges();

		expect(getInputs().every((input) => input.disabled)).toBe(true);
	});

	it('should respect the disabled state of individual checkboxes', () => {
		fixture.componentRef.setInput('checkboxes', [
			{
				id: 'a',
				label: 'Option A',
				value: 'a',
				disabled: true
			},
			{
				id: 'b',
				label: 'Option B',
				value: 'b'
			}
		]);

		fixture.detectChanges();

		const inputs = getInputs();

		expect(inputs[0].disabled).toBe(true);
		expect(inputs[1].disabled).toBe(false);
	});
});
