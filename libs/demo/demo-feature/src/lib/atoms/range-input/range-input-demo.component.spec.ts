/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { RangeInputDemoComponent } from './range-input-demo.component';

describe('RangeInputDemoComponent', () => {
	let component: RangeInputDemoComponent;
	let fixture: ComponentFixture<RangeInputDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [RangeInputDemoComponent]
		});

		fixture = TestBed.createComponent(RangeInputDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
