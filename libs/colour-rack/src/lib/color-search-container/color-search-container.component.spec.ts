/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ColorSearchContainerComponent } from './color-search-container.component';
import { ColorGridComponent } from '../color-grid/color-grid.component';
import { ColorSearchComponent } from '../color-search/color-search.component';
import { setupTestingModule } from '../../test-setup';
import { Meta, Title } from '@angular/platform-browser';
import Mocked = jest.Mocked;

describe('ColorSearchContainerComponent', () => {
	let component: ColorSearchContainerComponent;
	let fixture: ComponentFixture<ColorSearchContainerComponent>;
	let mockMeta: Mocked<Meta>;
	let mockTitle: Mocked<Title>;

	beforeEach(async () => {
		mockMeta = {
			addTag: jest.fn()
		} as unknown as jest.Mocked<Meta>;
		mockTitle = {
			setTitle: jest.fn()
		} as unknown as jest.Mocked<Title>;
		await setupTestingModule({
			imports: [ColorSearchContainerComponent, ColorSearchComponent, ColorGridComponent],
			providers: [
				{ provide: Meta, useValue: mockMeta },
				{ provide: Title, useValue: mockTitle }
			]
		});

		fixture = TestBed.createComponent(ColorSearchContainerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should update search query', () => {
		const newQuery = 'blue';
		component.updateSearchQuery(newQuery);
		expect(component.searchQuery()).toBe(newQuery);
	});

	it('should initialize search query as empty string', () => {
		expect(component.searchQuery()).toBe('');
	});

	it('should handle empty search query update', () => {
		component.updateSearchQuery('');
		expect(component.searchQuery()).toBe('');
	});

	it('should set the title and meta description', fakeAsync(() => {
		component.ngOnInit();
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();
		expect(mockTitle.setTitle).toHaveBeenCalledWith('colorRack.ColorSearchContainerComponent.meta.Title');
		expect(mockMeta.addTag).toHaveBeenCalledWith({
			name: 'description',
			content: 'colorRack.ColorSearchContainerComponent.meta.Description'
		});
	}));
});
