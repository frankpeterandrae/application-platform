/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';
import { ButtonComponent } from '../button/button.component';

import { DropdownSelectComponent } from './dropdown-select.component';

describe('DropdownSelectComponent', () => {
	let component: DropdownSelectComponent<any>;
	let fixture: ComponentFixture<DropdownSelectComponent<any>>;

	afterEach(() => {
		vi.restoreAllMocks();
	});

	beforeEach(async () => {
		await setupTestingModule({
			imports: [DropdownSelectComponent]
		});

		fixture = TestBed.createComponent(DropdownSelectComponent);
		component = fixture.componentInstance;
		// provide a default options input early to satisfy the required input contract
		fixture.componentRef.setInput('options', []);
		fixture.detectChanges();
	});

	it('should select an option and emit the selection', () => {
		const handler = vi.fn();

		fixture.componentRef.setInput('options', [
			{ value: 'a', label: 'Alpha' },
			{ value: 'b', label: 'Bravo' }
		]);

		component.selectionChange.subscribe(handler);

		fixture.detectChanges();

		getTriggerButton().buttonClick.emit();
		fixture.detectChanges();

		getOptionButtons()[1].buttonClick.emit();
		fixture.detectChanges();

		expect(component.selected()).toBe('b');
		expect(handler).toHaveBeenCalledWith('b');
		expect(getTriggerElement().textContent).toContain('Bravo');
	});

	it('should not select a disabled option', () => {
		const handler = vi.fn();

		fixture.componentRef.setInput('options', [
			{ value: 'a', label: 'Alpha', disabled: true },
			{ value: 'b', label: 'Bravo' }
		]);

		component.selectionChange.subscribe(handler);

		fixture.detectChanges();

		getTriggerButton().buttonClick.emit();
		fixture.detectChanges();

		getOptionButtons()[0].buttonClick.emit();

		expect(component.selected()).toBeNull();
		expect(handler).not.toHaveBeenCalled();
	});

	it('should synchronize selection from the native select', () => {
		fixture.componentRef.setInput('options', [
			{ value: 'a', label: 'Alpha' },
			{ value: 'b', label: 'Bravo' }
		]);

		fixture.detectChanges();

		const select = fixture.nativeElement.querySelector('.fpa-dropdown-select-native-select') as HTMLSelectElement;

		select.value = '1';
		select.dispatchEvent(new Event('change'));

		expect(component.selected()).toBe('b');
	});

	it('should use the provided aria label for the native select', () => {
		fixture.componentRef.setInput('ariaLabel', 'Choose a color');
		fixture.detectChanges();

		const select = fixture.nativeElement.querySelector('.fpa-dropdown-select-native-select') as HTMLSelectElement;

		expect(select.getAttribute('aria-label')).toBe('Choose a color');
	});

	function getTriggerButton(): ButtonComponent {
		return fixture.debugElement.query(By.directive(ButtonComponent)).componentInstance;
	}

	function getTriggerElement(): HTMLElement {
		return fixture.nativeElement.querySelector('theme-button');
	}

	function getOptionButtons(): ButtonComponent[] {
		return fixture.debugElement
			.queryAll(By.directive(ButtonComponent))
			.slice(1)
			.map((debugElement) => debugElement.componentInstance);
	}
});
