/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { LanguageToggleDemoComponent } from './language-toggle-demo.component';

describe('LanguageToggleDemoComponent', () => {
	let component: LanguageToggleDemoComponent;
	let fixture: ComponentFixture<LanguageToggleDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [LanguageToggleDemoComponent]
		});

		fixture = TestBed.createComponent(LanguageToggleDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
