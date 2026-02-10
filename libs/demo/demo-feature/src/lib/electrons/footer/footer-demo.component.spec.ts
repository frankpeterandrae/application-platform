/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { FooterDemoComponent } from './footer-demo.component';

describe('FooterDemoComponent', () => {
	let component: FooterDemoComponent;
	let fixture: ComponentFixture<FooterDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [FooterDemoComponent]
		});

		fixture = TestBed.createComponent(FooterDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
