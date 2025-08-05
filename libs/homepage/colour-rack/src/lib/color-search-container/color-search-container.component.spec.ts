/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import type { Mocked } from '@application-platform/testing';
import { createMock } from '@application-platform/testing';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { ColorGridComponent } from '../color-grid/color-grid.component';
import { ColorSearchComponent } from '../color-search/color-search.component';

import { ColorSearchContainerComponent } from './color-search-container.component';

describe('ColorSearchContainerComponent', () => {
	let component: ColorSearchContainerComponent;
	let fixture: ComponentFixture<ColorSearchContainerComponent>;
	let mockMeta: Mocked<Meta>;
	let mockTitle: Mocked<Title>;

	beforeEach(async () => {
		mockMeta = createMock<Meta>({ addTag: vi.fn() });
		mockTitle = createMock<Title>({ setTitle: vi.fn() });
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

	it('should set the title and meta description', async () => {
		component.ngOnInit();
		// Wait for translation simulation
		await new Promise((r) => setTimeout(r, 100));
		fixture.detectChanges();
		expect(mockTitle.setTitle).toHaveBeenCalledWith('colorRack.ColorSearchContainerComponent.meta.Title');
		expect(mockMeta.addTag).toHaveBeenCalledWith({
			name: 'description',
			content: 'colorRack.ColorSearchContainerComponent.meta.Description'
		});
	});
});
