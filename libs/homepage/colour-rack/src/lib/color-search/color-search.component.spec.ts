/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import { ColorSearchComponent } from './color-search.component';

describe('ColorSearchComponent', () => {
	let component: ColorSearchComponent;
	let fixture: ComponentFixture<ColorSearchComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ColorSearchComponent]
		});

		fixture = TestBed.createComponent(ColorSearchComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should emit searchEvent with the provided search term', () => {
		const searchTerm = 'blue';
		const searchEventSpy = vi.spyOn(component.searchEvent, 'emit');
		component.onSearchTermChange(searchTerm);
		expect(searchEventSpy).toHaveBeenCalledWith(searchTerm);
	});
});
