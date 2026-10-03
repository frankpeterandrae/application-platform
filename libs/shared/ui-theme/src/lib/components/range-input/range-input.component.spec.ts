/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';
import { InputComponent } from '../input/input.component';

import { RangeInputComponent } from './range-input.component';

describe('RangeInputComponent', () => {
	let component: RangeInputComponent;
	let fixture: ComponentFixture<RangeInputComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [RangeInputComponent]
		});

		fixture = TestBed.createComponent(RangeInputComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should render a value written by the form', async () => {
		component.writeValue({
			from: '1',
			to: '10'
		});

		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();

		const inputs = fixture.nativeElement.querySelectorAll('input');

		expect(inputs[0].value).toBe('1');
		expect(inputs[1].value).toBe('10');
	});

	it('should update the lower bound and notify consumers', () => {
		const onChange = vi.fn();
		const emitSpy = vi.spyOn(component.valueChange, 'emit');

		component.registerOnChange(onChange);
		component.writeValue({
			from: '1',
			to: '10'
		});

		fixture.detectChanges();

		const inputs = fixture.debugElement.queryAll(By.directive(InputComponent));

		inputs[0].componentInstance.valueChange.emit('2');

		expect(component.value()).toEqual({
			from: '2',
			to: '10'
		});

		expect(onChange).toHaveBeenCalledWith({
			from: '2',
			to: '10'
		});

		expect(emitSpy).toHaveBeenCalledWith({
			from: '2',
			to: '10'
		});
	});

	it('should mark the control as touched when an inner input blurs', () => {
		const onTouched = vi.fn();

		component.registerOnTouched(onTouched);

		const inputs = fixture.debugElement.queryAll(By.directive(InputComponent));

		inputs[0].triggerEventHandler('blur');

		expect(onTouched).toHaveBeenCalledOnce();
	});

	it('should disable both inner inputs through the CVA', () => {
		component.setDisabledState(true);
		fixture.detectChanges();

		const inputs = fixture.debugElement.queryAll(By.directive(InputComponent));

		expect(inputs[0].componentInstance.disabled()).toBe(true);
		expect(inputs[1].componentInstance.disabled()).toBe(true);
	});

	it('should clear both values when writeValue receives null', () => {
		component.writeValue({
			from: '1',
			to: '10'
		});

		component.writeValue(null);

		expect(component.value()).toEqual({
			from: '',
			to: ''
		});
	});
});
