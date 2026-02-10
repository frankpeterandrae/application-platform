/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { TabsDemoComponent } from './tabs-demo.component';

describe('TabsDemoComponent', () => {
	let component: TabsDemoComponent;
	let fixture: ComponentFixture<TabsDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TabsDemoComponent]
		});

		fixture = TestBed.createComponent(TabsDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
