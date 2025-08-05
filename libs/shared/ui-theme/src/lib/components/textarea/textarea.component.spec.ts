/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { TextareaComponent } from './textarea.component';

describe('TextareaComponent', () => {
	let component: TextareaComponent;
	let fixture: ComponentFixture<TextareaComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TextareaComponent]
		});

		fixture = TestBed.createComponent(TextareaComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
