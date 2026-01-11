/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import { TypographyDemoComponent } from './typography-demo.component';

describe('TypographyComponent', () => {
	let component: TypographyDemoComponent;
	let fixture: ComponentFixture<TypographyDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TypographyDemoComponent]
		});

		fixture = TestBed.createComponent(TypographyDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
