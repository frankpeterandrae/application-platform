/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { TextareaComponent } from './textarea.component';

describe('TextareaComponent', () => {
	let component: TextareaComponent;
	let fixture: ComponentFixture<TextareaComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TextareaComponent]
		});

		fixture = TestBed.createComponent(TextareaComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should render a value written by the form without user interaction', () => {
		component.writeValue('written value');

		fixture.detectChanges();

		const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

		expect(textarea.value).toBe('written value');
	});

	it('onInput updates value, calls onChange, and emits valueChange', () => {
		const onChange = vi.fn();
		const emitSpy = vi.spyOn(component.valueChange, 'emit');
		component.registerOnChange(onChange);

		component.onInput({ target: { value: 'Hello' } } as unknown as Event);

		expect(component.value()).toBe('Hello');
		expect(onChange).toHaveBeenCalledWith('Hello');
		expect(emitSpy).toHaveBeenCalledWith('Hello');
	});

	it('should return true when value is present', () => {
		component.value.set('Some text');

		expect(component.isFilled()).toBe(true);
	});

	it('should return true when placeholder is present', () => {
		fixture.componentRef.setInput('placeholder', 'hint');

		fixture.detectChanges();

		expect(component.isFilled()).toBe(true);
	});

	it('should return false when value and placeholder are empty', () => {
		component.value.set('');

		fixture.componentRef.setInput('placeholder', '');

		fixture.detectChanges();

		expect(component.isFilled()).toBe(false);
	});

	it('onFocus and onBlur toggle focus and call onTouched', () => {
		const onTouched = vi.fn();
		component.registerOnTouched(onTouched);

		component.onFocus();
		expect(component.textareaFocused).toBe(true);

		component.onBlur();
		expect(component.textareaFocused).toBe(false);
		expect(onTouched).toHaveBeenCalled();
	});

	it('isFloating depends on isDynamic and focus', () => {
		fixture.componentRef.setInput('isDynamic', true);
		fixture.detectChanges();

		component.onFocus();
		expect((component as unknown as { isFloating: () => boolean }).isFloating()).toBe(true);

		fixture.componentRef.setInput('isDynamic', false);
		fixture.detectChanges();
		expect((component as unknown as { isFloating: () => boolean }).isFloating()).toBe(false);
	});
});
