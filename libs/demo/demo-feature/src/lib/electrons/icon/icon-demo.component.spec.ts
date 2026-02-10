/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { IconDemoComponent } from './icon-demo.component';

describe('IconComponent', () => {
	let component: IconDemoComponent;
	let fixture: ComponentFixture<IconDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [IconDemoComponent]
		});

		fixture = TestBed.createComponent(IconDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
