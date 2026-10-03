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

	it('should render a value written by Angular forms', () => {
		component.writeValue('green');
		fixture.detectChanges();

		expect(getTrigger().textContent).toContain('Green');
	});

	it('should render multiple values written by Angular forms', () => {
		fixture.componentRef.setInput('multiple', true);

		component.writeValue(['red', 'blue']);
		fixture.detectChanges();

		expect(getTrigger().textContent).toContain('Red, Blue');
	});

	it('should disable the trigger through the CVA', () => {
		component.setDisabledState(true);
		fixture.detectChanges();

		expect(getTrigger().disabled).toBe(true);
	});

	it('should mark the control as touched on blur', () => {
		const onTouched = vi.fn();

		component.registerOnTouched(onTouched);

		getTrigger().dispatchEvent(new Event('blur'));

		expect(onTouched).toHaveBeenCalledOnce();
	});

	it('should open the option list when clicked', () => {
		clickTrigger();

		expect(document.querySelector('[role="listbox"]')).not.toBeNull();
	});

	it('should select an option and notify Angular forms', () => {
		const onChange = vi.fn();

		component.registerOnChange(onChange);

		clickTrigger();

		const renderedOptions = getOptions();

		// Index 0 ist die leere Auswahl.
		renderedOptions[2].click();
		fixture.detectChanges();

		expect(onChange).toHaveBeenCalledWith('green');
		expect(getTrigger().textContent).toContain('Green');
		expect(document.querySelector('[role="listbox"]')).toBeNull();
	});

	it('should clear a single selection through the empty option', () => {
		const onChange = vi.fn();

		component.writeValue('red');
		component.registerOnChange(onChange);

		clickTrigger();

		getOptions()[0].click();
		fixture.detectChanges();

		expect(onChange).toHaveBeenCalledWith(undefined);
		expect(getTrigger().textContent?.trim()).toBe('');
	});

	it('should toggle values in multiple mode', () => {
		fixture.componentRef.setInput('multiple', true);
		fixture.detectChanges();

		const onChange = vi.fn();
		component.registerOnChange(onChange);

		clickTrigger();

		const renderedOptions = getOptions();

		renderedOptions[0].click();
		fixture.detectChanges();

		expect(onChange).toHaveBeenCalledWith(['red']);

		renderedOptions[0].click();
		fixture.detectChanges();

		expect(onChange).toHaveBeenLastCalledWith([]);
	});

	it('should open with ArrowDown', () => {
		const event = keydown('ArrowDown');

		expect(event.defaultPrevented).toBe(true);
		expect(document.querySelector('[role="listbox"]')).not.toBeNull();
	});

	it('should select the active option with Enter', () => {
		const onChange = vi.fn();

		component.registerOnChange(onChange);

		keydown('ArrowDown');
		keydown('ArrowDown');
		keydown('Enter');

		expect(onChange).toHaveBeenCalledWith('red');
	});

	it('should close with Escape without changing the value', () => {
		const onChange = vi.fn();

		component.writeValue('green');
		component.registerOnChange(onChange);

		keydown('ArrowDown');
		keydown('Escape');

		expect(document.querySelector('[role="listbox"]')).toBeNull();
		expect(onChange).not.toHaveBeenCalled();
		expect(getTrigger().textContent).toContain('Green');
	});

	it('should expose combobox semantics', () => {
		const trigger = getTrigger();

		expect(trigger.getAttribute('role')).toBe('combobox');
		expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(trigger.getAttribute('aria-controls')).toBe(`${trigger.id}-listbox`);
	});

	it('should expose listbox semantics when opened', () => {
		clickTrigger();

		const listbox = document.querySelector('[role="listbox"]');
		const renderedOptions = document.querySelectorAll('[role="option"]');

		expect(listbox).not.toBeNull();
		expect(renderedOptions).toHaveLength(4);
		expect(getTrigger().getAttribute('aria-expanded')).toBe('true');
	});

	it('should mark a multiple listbox as multiselectable', () => {
		fixture.componentRef.setInput('multiple', true);
		fixture.detectChanges();

		clickTrigger();

		const listbox = document.querySelector('[role="listbox"]');

		expect(listbox?.getAttribute('aria-multiselectable')).toBe('true');
	});

	function getTrigger(): HTMLButtonElement {
		return fixture.nativeElement.querySelector('.fpa-select');
	}

	function clickTrigger(): void {
		getTrigger().click();
		fixture.detectChanges();
	}

	function getOptions(): HTMLButtonElement[] {
		return Array.from(document.querySelectorAll<HTMLButtonElement>('.fpa-select-option'));
	}

	function keydown(key: string): KeyboardEvent {
		const event = new KeyboardEvent('keydown', {
			key,
			cancelable: true,
			bubbles: true
		});

		getTrigger().dispatchEvent(event);
		fixture.detectChanges();

		return event;
	}
});
