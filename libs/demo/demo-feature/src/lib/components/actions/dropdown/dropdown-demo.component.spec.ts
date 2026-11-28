/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { assert } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';

import { DropdownDemoComponent } from './dropdown-demo.component';

describe('DropdownDemoComponent', () => {
	let fixture: ComponentFixture<DropdownDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [DropdownDemoComponent]
		});

		fixture = TestBed.createComponent(DropdownDemoComponent);
		fixture.detectChanges();
	});

	it('should display the selected person', () => {
		const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>('theme-dropdown-select select');
		assert(select);
		select.value = '0';
		select.dispatchEvent(new Event('change'));
		fixture.detectChanges();

		expect(fixture.nativeElement.textContent).toContain('Selected: Alice');
	});
});
