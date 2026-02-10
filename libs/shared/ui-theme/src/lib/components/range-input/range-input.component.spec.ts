/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

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

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('writeValue updates value', () => {
		const value = { from: '1', to: '10' };
		component.writeValue(value);
		expect(component.value).toEqual(value);
	});

	it('registerOnChange stores callback', () => {
		const onChange = vi.fn();
		component.registerOnChange(onChange);
		component.onChange({ from: '2', to: '3' });
		expect(onChange).toHaveBeenCalledWith({ from: '2', to: '3' });
	});

	it('registerOnTouched stores callback', () => {
		const onTouched = vi.fn();
		component.registerOnTouched(onTouched);
		component.onTouched();
		expect(onTouched).toHaveBeenCalled();
	});
});
