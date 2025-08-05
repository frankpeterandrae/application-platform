/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { CheckboxGroupComponent } from './checkbox-group.component';

describe('CheckboxGroupComponent', () => {
	let component: CheckboxGroupComponent;
	let fixture: ComponentFixture<CheckboxGroupComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [CheckboxGroupComponent]
		});

		fixture = TestBed.createComponent(CheckboxGroupComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
