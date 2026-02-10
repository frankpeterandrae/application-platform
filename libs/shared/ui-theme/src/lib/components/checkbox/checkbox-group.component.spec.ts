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

	it('setDisabledState updates disabled flag', () => {
		component.setDisabledState(true);
		expect((component as unknown as { disabled: boolean }).disabled).toBe(true);
	});
});
