/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { HeaderDemoComponent } from './header-demo.component';

describe('HeaderDemoComponent', () => {
	let component: HeaderDemoComponent;
	let fixture: ComponentFixture<HeaderDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [HeaderDemoComponent]
		});

		fixture = TestBed.createComponent(HeaderDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
