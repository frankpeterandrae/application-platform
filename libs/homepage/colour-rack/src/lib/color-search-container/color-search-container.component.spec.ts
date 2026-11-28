/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By, Meta, Title } from '@angular/platform-browser';
import { type Mocked, createMock } from '@application-platform/testing';
import { assert, vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { ColorGridComponent } from '../color-grid/color-grid.component';

import { ColorSearchContainerComponent } from './color-search-container.component';

describe('ColorSearchContainerComponent', () => {
	let fixture: ComponentFixture<ColorSearchContainerComponent>;
	let mockMeta: Mocked<Meta>;
	let mockTitle: Mocked<Title>;

	beforeEach(async () => {
		mockMeta = createMock<Meta>({
			addTag: vi.fn()
		});

		mockTitle = createMock<Title>({
			setTitle: vi.fn()
		});

		await setupTestingModule({
			imports: [ColorSearchContainerComponent],
			providers: [
				{ provide: Meta, useValue: mockMeta },
				{ provide: Title, useValue: mockTitle }
			]
		});

		fixture = TestBed.createComponent(ColorSearchContainerComponent);

		fixture.detectChanges();
	});

	it('forwards typed and cleared search terms to the grid input', () => {
		const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('cr-color-search input');
		assert(input);
		const grid = fixture.debugElement.query(By.directive(ColorGridComponent)).componentInstance as ColorGridComponent;

		input.value = 'blue';
		input.dispatchEvent(new Event('input'));
		fixture.detectChanges();
		expect(grid.searchQuery()).toBe('blue');

		input.value = '';
		input.dispatchEvent(new Event('input'));
		fixture.detectChanges();
		expect(grid.searchQuery()).toBe('');
	});

	it('should set the page metadata', () => {
		expect(mockTitle.setTitle).toHaveBeenCalledWith('colourRackI18n.ColorSearchContainer.meta.Title');

		expect(mockMeta.addTag).toHaveBeenCalledWith({
			name: 'description',
			content: 'colourRackI18n.ColorSearchContainer.meta.Description'
		});
	});
});
