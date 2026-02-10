/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { SelectDemoComponent } from './select-demo.component';

describe('SelectDemoComponent', () => {
	let component: SelectDemoComponent;
	let fixture: ComponentFixture<SelectDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [SelectDemoComponent]
		});

		fixture = TestBed.createComponent(SelectDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
