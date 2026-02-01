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
});
