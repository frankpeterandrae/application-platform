/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';
import { ButtonComponent } from '../../actions/button/button.component';

import { DropdownSelectComponent } from './dropdown-select.component';

describe('DropdownSelectComponent', () => {
	let component: DropdownSelectComponent<any>;
	let fixture: ComponentFixture<DropdownSelectComponent<any>>;

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
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

	it('should stay closed when disabled', () => {
		fixture.componentRef.setInput('disabled', true);
		fixture.detectChanges();

		getTriggerButton().buttonClick.emit();
		fixture.detectChanges();

		expect(getPopup().classList).not.toContain('open');
	});

	it('should toggle from the keyboard with Enter', () => {
		const event = new KeyboardEvent('keydown', {
			key: 'Enter',
			cancelable: true
		});

		getTriggerButton().keydownEvent.emit(event);
		fixture.detectChanges();

		expect(event.defaultPrevented).toBe(true);
		expect(getPopup().classList).toContain('open');

		getTriggerButton().keydownEvent.emit(event);
		fixture.detectChanges();

		expect(getPopup().classList).not.toContain('open');
	});

	it('should skip disabled options during keyboard navigation', () => {
		const handler = vi.fn();

		fixture.componentRef.setInput('options', [
			{ value: 'a', label: 'Alpha', disabled: true },
			{ value: 'b', label: 'Bravo' },
			{ value: 'c', label: 'Charlie' }
		]);
		component.selectionChange.subscribe(handler);
		fixture.detectChanges();

		getTriggerButton().keydownEvent.emit(keyboardEvent('ArrowDown'));
		fixture.detectChanges();

		const wrappers = getOptionWrappers();
		expect(wrappers[1].getAttribute('tabindex')).toBe('0');

		wrappers[1].dispatchEvent(keyboardEvent('Enter'));
		fixture.detectChanges();

		expect(component.selected()).toBe('b');
		expect(handler).toHaveBeenCalledWith('b');
	});

	it('should navigate upward from a closed dropdown to the last enabled option', () => {
		fixture.componentRef.setInput('options', [
			{ value: 'a', label: 'Alpha' },
			{ value: 'b', label: 'Bravo', disabled: true },
			{ value: 'c', label: 'Charlie' }
		]);
		fixture.detectChanges();

		getTriggerButton().keydownEvent.emit(keyboardEvent('ArrowUp'));
		fixture.detectChanges();

		const wrappers = getOptionWrappers();
		expect(wrappers[2].getAttribute('tabindex')).toBe('0');
	});

	it('should close when clicking outside but remain open for inside clicks', () => {
		fixture.componentRef.setInput('options', [{ value: 'a', label: 'Alpha' }]);
		fixture.detectChanges();

		getTriggerButton().buttonClick.emit();
		fixture.detectChanges();

		getTriggerElement().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		expect(getPopup().classList).toContain('open');

		document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		fixture.detectChanges();

		expect(getPopup().classList).not.toContain('open');
	});

	it('should close the list with Tab and Escape', () => {
		fixture.componentRef.setInput('options', [{ value: 'a', label: 'Alpha' }]);
		fixture.detectChanges();

		getTriggerButton().buttonClick.emit();
		fixture.detectChanges();

		getOptionWrappers()[0].dispatchEvent(keyboardEvent('Tab'));
		fixture.detectChanges();
		expect(getPopup().classList).not.toContain('open');

		getTriggerButton().buttonClick.emit();
		fixture.detectChanges();

		const escape = keyboardEvent('Escape');
		getOptionWrappers()[0].dispatchEvent(escape);
		fixture.detectChanges();

		expect(escape.defaultPrevented).toBe(true);
		expect(getPopup().classList).not.toContain('open');
	});

	it('should ignore invalid native select values', () => {
		fixture.componentRef.setInput('options', [{ value: 'a', label: 'Alpha' }]);
		fixture.detectChanges();

		const select = fixture.nativeElement.querySelector('.fpa-dropdown-select-native-select') as HTMLSelectElement;

		Object.defineProperty(select, 'value', {
			configurable: true,
			value: '99'
		});
		select.dispatchEvent(new Event('change'));

		expect(component.selected()).toBeNull();
	});

	it('should align and flip the popup when it would overflow the viewport', () => {
		fixture.componentRef.setInput('options', [{ value: 'a', label: 'Alpha' }]);
		fixture.detectChanges();

		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			callback(0);
			return 1;
		});

		const host = fixture.nativeElement.querySelector('.fpa-dropdown-select') as HTMLElement;
		const popup = getPopup();

		vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({
			left: 900,
			right: 980,
			top: 700,
			bottom: 740,
			width: 80,
			height: 40,
			x: 900,
			y: 700,
			toJSON: () => ({})
		});
		vi.spyOn(popup, 'getBoundingClientRect').mockReturnValue({
			left: 0,
			right: 220,
			top: 0,
			bottom: 200,
			width: 220,
			height: 200,
			x: 0,
			y: 0,
			toJSON: () => ({})
		});
		vi.stubGlobal('innerWidth', 1000);
		vi.stubGlobal('innerHeight', 800);

		getTriggerButton().buttonClick.emit();
		fixture.detectChanges();

		expect(popup.classList).toContain('align-right');
		expect(popup.classList).toContain('flip-up');
		expect(popup.style.right).not.toBe('');
		expect(popup.style.bottom).not.toBe('');

		window.dispatchEvent(new Event('resize'));
	});

	it('should close from the trigger with Escape', () => {
		fixture.componentRef.setInput('options', [{ value: 'a', label: 'Alpha' }]);
		fixture.detectChanges();

		getTriggerButton().buttonClick.emit();
		fixture.detectChanges();

		const event = keyboardEvent('Escape');
		getTriggerButton().keydownEvent.emit(event);
		fixture.detectChanges();

		expect(event.defaultPrevented).toBe(true);
		expect(getPopup().classList).not.toContain('open');
	});

	it('should move between options with ArrowDown and ArrowUp in the list', () => {
		fixture.componentRef.setInput('options', [
			{ value: 'a', label: 'Alpha' },
			{ value: 'b', label: 'Bravo' },
			{ value: 'c', label: 'Charlie' }
		]);
		fixture.detectChanges();

		getTriggerButton().buttonClick.emit();
		fixture.detectChanges();

		const wrappers = getOptionWrappers();

		wrappers[0].dispatchEvent(keyboardEvent('ArrowDown'));
		fixture.detectChanges();
		expect(wrappers[0].getAttribute('tabindex')).toBe('0');

		wrappers[0].dispatchEvent(keyboardEvent('ArrowDown'));
		fixture.detectChanges();
		expect(wrappers[1].getAttribute('tabindex')).toBe('0');

		wrappers[1].dispatchEvent(keyboardEvent('ArrowUp'));
		fixture.detectChanges();
		expect(wrappers[0].getAttribute('tabindex')).toBe('0');
	});

	it('should ignore native change events from non-select targets', () => {
		const host = fixture.nativeElement.querySelector('.fpa-dropdown-select') as HTMLElement;

		host.dispatchEvent(new Event('change', { bubbles: true }));

		expect(component.selected()).toBeNull();
	});

	it('should log and ignore popup measurement errors', () => {
		fixture.componentRef.setInput('options', [{ value: 'a', label: 'Alpha' }]);
		fixture.detectChanges();

		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			callback(0);
			return 1;
		});

		const host = fixture.nativeElement.querySelector('.fpa-dropdown-select') as HTMLElement;
		vi.spyOn(host, 'getBoundingClientRect').mockImplementation(() => {
			throw new Error('measurement failed');
		});

		expect(() => getTriggerButton().buttonClick.emit()).not.toThrow();
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

	function getPopup(): HTMLElement {
		return fixture.nativeElement.querySelector('.fpa-dropdown-select-list-container');
	}

	function getOptionWrappers(): HTMLElement[] {
		return Array.from(fixture.nativeElement.querySelectorAll('.fpa-dropdown-select-list > div'));
	}

	function keyboardEvent(key: string): KeyboardEvent {
		return new KeyboardEvent('keydown', {
			key,
			cancelable: true,
			bubbles: true
		});
	}

	function getOptionButtons(): ButtonComponent[] {
		return fixture.debugElement
			.queryAll(By.directive(ButtonComponent))
			.slice(1)
			.map((debugElement) => debugElement.componentInstance);
	}
});
