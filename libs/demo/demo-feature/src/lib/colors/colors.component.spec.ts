/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import { ColorsComponent } from './colors.component';

describe('TypographyComponent', () => {
	let component: ColorsComponent;
	let fixture: ComponentFixture<ColorsComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ColorsComponent]
		});

		fixture = TestBed.createComponent(ColorsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
