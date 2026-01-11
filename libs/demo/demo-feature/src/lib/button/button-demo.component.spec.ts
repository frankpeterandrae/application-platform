/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import { ButtonDemoComponent } from './button-demo.component';

describe('ButtonComponent', () => {
	let component: ButtonDemoComponent;
	let fixture: ComponentFixture<ButtonDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ButtonDemoComponent]
		});

		fixture = TestBed.createComponent(ButtonDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
