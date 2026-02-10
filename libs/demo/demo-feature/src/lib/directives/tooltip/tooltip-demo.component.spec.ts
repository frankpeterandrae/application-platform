/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { TooltipDemoComponent } from './tooltip-demo.component';

describe('TooltipDemoComponent', () => {
	let component: TooltipDemoComponent;
	let fixture: ComponentFixture<TooltipDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TooltipDemoComponent]
		});

		fixture = TestBed.createComponent(TooltipDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
