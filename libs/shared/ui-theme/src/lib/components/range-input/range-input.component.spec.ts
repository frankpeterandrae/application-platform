/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { RangeInputComponent } from './range-input.component';

describe('RangeInputComponent', () => {
	let component: RangeInputComponent;
	let fixture: ComponentFixture<RangeInputComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [RangeInputComponent]
		});

		fixture = TestBed.createComponent(RangeInputComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
