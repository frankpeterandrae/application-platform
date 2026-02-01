/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { DropdownSelectComponent } from './dropdown-select.component';

describe('DropdownSelectComponent', () => {
	let component: DropdownSelectComponent<any>;
	let fixture: ComponentFixture<DropdownSelectComponent<any>>;
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

	it('creates the component and renders placeholder when no selection', () => {
		fixture.componentRef.setInput('options', []);
		fixture.detectChanges();
		expect(component).toBeTruthy();
		const btn = fixture.nativeElement.querySelector('theme-button');
		expect(btn).toBeTruthy();
	});

	it('toggles open state and reflects open class on popup container', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		const container = fixture.nativeElement.querySelector('.fpa-dropdown-select-list-container') as HTMLElement;
		expect(container.classList.contains('open')).toBeFalsy();

		component.toggle();
		fixture.detectChanges();
		expect(component.isOpen()).toBeTruthy();
		expect(container.classList.contains('open')).toBeTruthy();

		component.toggle();
		fixture.detectChanges();
		expect(component.isOpen()).toBeFalsy();
		expect(container.classList.contains('open')).toBeFalsy();
	});

	it('aligns popup to the right (adds align-right) when popup would overflow viewport', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		const hostEl = fixture.nativeElement.querySelector('.fpa-dropdown-select') as HTMLElement;
		const popupContainer = fixture.nativeElement.querySelector('.fpa-dropdown-select-list-container') as HTMLElement;

		// stub requestAnimationFrame to run synchronously
		const rafMock = vi.spyOn(window as any, 'requestAnimationFrame').mockImplementation((cb: any) => cb());

		// make host appear near the right edge
		hostEl.getBoundingClientRect = () => ({ left: window.innerWidth - 20 }) as any;
		// make popup width such that popupLeft + popupWidth + margin > window.innerWidth
		popupContainer.getBoundingClientRect = () => ({ width: 100 }) as any;

		component.open();
		// do not call fixture.detectChanges() here to avoid ExpressionChangedAfterItHasBeenCheckedError;
		// the alignment mutates the DOM class directly via classList, so assert the DOM state
		expect(popupContainer.classList.contains('align-right')).toBeTruthy();

		rafMock.mockRestore();
	});

	it('syncs native select change into the component selected model', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' },
			{ value: 'c', label: 'C' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		const nativeSelect = fixture.nativeElement.querySelector('.fpa-dropdown-select-native-select') as HTMLSelectElement;
		expect(nativeSelect).toBeTruthy();

		// simulate choosing index 1
		nativeSelect.value = '1';
		nativeSelect.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		expect(component.selected()).toBe('b');
	});

	it('does not select a disabled option when selectOption is called', () => {
		const opts = [
			{ value: 'a', label: 'A', disabled: true },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		component.selectOption(opts[0]);
		expect(component.selected()).toBeNull();

		component.selectOption(opts[1]);
		expect(component.selected()).toBe('b');
	});

	it('pressing Enter or Space on button toggles open state', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		// Enter should toggle
		component.onButtonKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
		expect(component.isOpen()).toBeTruthy();

		// Space should toggle back
		component.onButtonKeydown(new KeyboardEvent('keydown', { key: ' ' }));
		expect(component.isOpen()).toBeFalsy();
	});

	it('arrow keys on button open dropdown and set active index skipping disabled options', () => {
		const opts = [
			{ value: 'a', label: 'A', disabled: true },
			{ value: 'b', label: 'B' },
			{ value: 'c', label: 'C' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		// ArrowDown opens and moves to first non-disabled (index 1)
		component.onButtonKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
		expect(component.isOpen()).toBeTruthy();
		expect(component.activeIndex()).toBe(1);

		component.close();

		// ArrowUp opens and moves to last non-disabled (index 2)
		component.onButtonKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
		expect(component.isOpen()).toBeTruthy();
		expect(component.activeIndex()).toBe(2);
	});

	it('pressing Enter on list selects the active option and Tab closes the list', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' },
			{ value: 'c', label: 'C' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		component.open();
		component.activeIndex.set(1);
		component.onListKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
		expect(component.selected()).toBe('b');

		component.open();
		component.onListKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));
		expect(component.isOpen()).toBeFalsy();
	});

	it('close resets activeIndex and removes align-right class', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		const popupContainer = fixture.nativeElement.querySelector('.fpa-dropdown-select-list-container') as HTMLElement;
		component.open();
		component.activeIndex.set(1);
		popupContainer.classList.add('align-right');

		component.close();
		expect(component.activeIndex()).toBe(-1);
		expect(popupContainer.classList.contains('align-right')).toBeFalsy();
	});

	it('window resize triggers alignment recalculation only when open', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		const adjustSpy = vi.spyOn(component as unknown as { adjustPopupAlignment: () => void }, 'adjustPopupAlignment');
		component.open();
		adjustSpy.mockClear();

		component.onWindowResize();
		expect(adjustSpy).toHaveBeenCalledTimes(1);

		component.close();
		adjustSpy.mockClear();
		component.onWindowResize();
		expect(adjustSpy).not.toHaveBeenCalled();
	});

	it('emits selectionChange when selecting an option', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		const handler = vi.fn();
		component.selectionChange.subscribe(handler);

		component.selectOption(opts[1]);
		expect(handler).toHaveBeenCalledWith('b');
	});

	it('ignores invalid native select indices', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		component.onNativeSelectChange({ target: { value: 'NaN' } } as unknown as Event);
		expect(component.selected()).toBeNull();

		component.onNativeSelectChange({ target: { value: '99' } } as unknown as Event);
		expect(component.selected()).toBeNull();
	});

	it('document mousedown outside of host closes the dropdown', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		component.open();
		expect(component.isOpen()).toBeTruthy();

		// Simulate a mousedown whose target is outside the component host
		component.onDocMouseDown({ target: document.body } as unknown as MouseEvent);
		expect(component.isOpen()).toBeFalsy();
	});

	it('disabled input prevents toggle, keyboard open, and selection', () => {
		const opts = [
			{ value: 'a', label: 'A' },
			{ value: 'b', label: 'B' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.componentRef.setInput('disabled', true);
		fixture.detectChanges();

		component.toggle();
		expect(component.isOpen()).toBeFalsy();

		component.onButtonKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
		expect(component.isOpen()).toBeFalsy();

		component.selectOption(opts[1]);
		expect(component.selected()).toBeNull();
	});

	it('buttonLabel reflects the selected option label', () => {
		const opts = [
			{ value: 'a', label: 'Alpha' },
			{ value: 'b', label: 'Bravo' }
		];
		fixture.componentRef.setInput('options', opts);
		fixture.detectChanges();

		component.selected.set('b');
		fixture.detectChanges();
		expect(component.buttonLabel()).toBe('Bravo');
	});
});
