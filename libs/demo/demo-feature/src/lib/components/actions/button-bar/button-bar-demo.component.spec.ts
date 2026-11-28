/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../../test-setup';

import { ButtonBarDemoComponent } from './button-bar-demo.component';

describe('ButtonBarDemoComponent', () => {
	let fixture: ComponentFixture<ButtonBarDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ButtonBarDemoComponent]
		});

		fixture = TestBed.createComponent(ButtonBarDemoComponent);
		fixture.detectChanges();
	});

	it('shows action, navigation and editing controls in separate groups', () => {
		const groups = (fixture.nativeElement as HTMLElement).querySelectorAll('theme-button-bar');
		const labels = Array.from(groups, (group) => Array.from(group.querySelectorAll('button'), (button) => button.textContent?.trim()));

		expect(labels).toEqual([
			['Cancel', 'Save'],
			['Previous', 'Next'],
			['Delete', 'Edit']
		]);
	});
});
