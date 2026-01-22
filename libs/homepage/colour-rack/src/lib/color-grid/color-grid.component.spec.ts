/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Mocked } from '@application-platform/testing';
import { createMock } from '@application-platform/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { ColorDetailsComponent } from '../color-details/color-details.component';
import { ColorType } from '../models/color-type.enum';
import type { Color } from '../models/color.model';
import { ColorService } from '../services/color.service';

import { ColorGridComponent } from './color-grid.component';

describe('ColorGridComponent', () => {
	let component: ColorGridComponent;
	let fixture: ComponentFixture<ColorGridComponent>;
	let colorService: Mocked<ColorService>;

	beforeEach(async () => {
		const colorServiceMock = createMock<ColorService>({
			getColors: vi.fn().mockReturnValue(of([])) // Ensure it returns an observable
		});

		await setupTestingModule({
			imports: [ColorGridComponent],
			providers: [{ provide: ColorService, useValue: colorServiceMock }]
		});

		fixture = TestBed.createComponent(ColorGridComponent);
		component = fixture.componentInstance;
		colorService = TestBed.inject(ColorService) as Mocked<ColorService>;
		fixture.detectChanges();
	});

	it('should fetch colors on init', () => {
		const colors: Color[] = [
			{
				name: 'Red',
				alternativeNames: [],
				highlighted: false,
				type: ColorType.B,
				mainColor: '',
				wave: '',
				row: 1,
				column: 2
			}
		];
		vi.spyOn(colorService as any, 'getColors').mockReturnValue(of(colors));

		component.ngOnInit();

		expect(colorService.getColors).toHaveBeenCalled();
		expect(component.colors()).toEqual([colors]);
	});

	it('should highlight matching colors', () => {
		const colors: Color[][] = [
			[
				{
					name: 'Red',
					alternativeNames: ['Crimson'],
					highlighted: false,
					type: ColorType.H,
					mainColor: '',
					wave: '',
					column: 1,
					row: 1
				}
			],
			[
				{
					name: 'Blue',
					alternativeNames: ['Azure'],
					highlighted: false,
					type: ColorType.S,
					mainColor: '',
					wave: '',
					column: 1,
					row: 2
				}
			]
		];
		component.colors.set(colors);

		component.highlightMatchingColors('red');

		expect(component.colors()[0][0].highlighted).toBe(true);
		expect(component.colors()[1][0].highlighted).toBe(false);
	});

	it('should handle empty search query', () => {
		const colors: Color[][] = [
			[
				{
					name: 'Red',
					alternativeNames: ['Crimson'],
					highlighted: false,
					type: ColorType.H,
					mainColor: '',
					wave: '',
					column: 1,
					row: 1
				}
			],
			[
				{
					name: 'Blue',
					alternativeNames: ['Azure'],
					highlighted: false,
					type: ColorType.S,
					mainColor: '',
					wave: '',
					column: 1,
					row: 2
				}
			]
		];

		component.colors.set(colors);

		component.highlightMatchingColors('');

		expect(component.colors()[0][0].highlighted).toBe(false);
		expect(component.colors()[1][0].highlighted).toBe(false);
	});

	it('should calculate correct storage location for a single color', () => {
		const colors: Color[] = [
			{
				name: 'Red',
				alternativeNames: [],
				highlighted: false,
				type: ColorType.B,
				mainColor: '',
				wave: '',
				row: 0,
				column: 0
			}
		];
		const result = component.calculateStorageLocation(colors);
		expect(result[0].row).toBe(1);
		expect(result[0].column).toBe(1);
	});

	it('should calculate correct storage location for multiple colors', () => {
		const colors: Color[] = [
			{
				name: 'Red',
				alternativeNames: [],
				highlighted: false,
				type: ColorType.B,
				mainColor: '',
				wave: '',
				row: 0,
				column: 0
			},
			{
				name: 'Blue',
				alternativeNames: [],
				highlighted: false,
				type: ColorType.B,
				mainColor: '',
				wave: '',
				row: 0,
				column: 0
			},
			{
				name: 'Green',
				alternativeNames: [],
				highlighted: false,
				type: ColorType.B,
				mainColor: '',
				wave: '',
				row: 0,
				column: 0
			},
			{
				name: 'Yellow',
				alternativeNames: [],
				highlighted: false,
				type: ColorType.B,
				mainColor: '',
				wave: '',
				row: 0,
				column: 0
			}
		];
		const result = component.calculateStorageLocation(colors);
		expect(result[0].row).toBe(1);
		expect(result[0].column).toBe(1);
		expect(result[1].row).toBe(1);
		expect(result[1].column).toBe(2);
		expect(result[2].row).toBe(1);
		expect(result[2].column).toBe(3);
		expect(result[3].row).toBe(1);
		expect(result[3].column).toBe(4);
	});

	it('should calculate correct storage location for colors spanning multiple rows', () => {
		const colors: Color[] = Array.from({ length: 15 }, (_, idx) => ({
			name: `Color ${idx + 1}`,
			alternativeNames: [],
			highlighted: false,
			type: ColorType.B,
			mainColor: '',
			wave: '',
			row: 0,
			column: 0
		}));
		const result = component.calculateStorageLocation(colors);
		expect(result[0].row).toBe(1);
		expect(result[0].column).toBe(1);
		expect(result[11].row).toBe(1);
		expect(result[11].column).toBe(12);
		expect(result[12].row).toBe(2);
		expect(result[12].column).toBe(1);
		expect(result[14].row).toBe(2);
		expect(result[14].column).toBe(3);
	});

	it('should open details dialog with correct configuration', () => {
		const dialogServiceSpy = vi.spyOn(component['dialogService'], 'open');
		const color: Color = {
			name: 'Red',
			alternativeNames: [],
			highlighted: false,
			type: ColorType.B,
			mainColor: '',
			wave: '',
			row: 1,
			column: 1
		};
		component.openDetails(color);
		expect(dialogServiceSpy).toHaveBeenCalledWith(ColorDetailsComponent, {
			componentData: color,
			settings: { title: color.name }
		});
	});

	it('should update item size based on first color tile dimensions', () => {
		const firstCard = document.createElement('div');
		Object.defineProperty(firstCard, 'offsetHeight', { value: 100, configurable: true });
		firstCard.style.marginTop = '10px';
		firstCard.style.marginBottom = '10px';
		vi.spyOn(component['viewPort']().elementRef.nativeElement, 'querySelector').mockReturnValue(firstCard);
		component['updateItemSize']();
		expect(component.itemSize).toBe(120); // 100px height + 10px marginTop + 10px marginBottom
	});

	it('should set item size to default when no color tile is found', () => {
		vi.spyOn(component['viewPort']().elementRef.nativeElement, 'querySelector').mockReturnValue(null);
		component['updateItemSize']();
		expect(component.itemSize).toBe(68);
	});

	it('should set chunk size based on screen width', () => {
		document.documentElement.style.fontSize = '16px';
		Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
		component['updateChunkSize']();
		expect(component['chunkSize']).toBe(2);

		Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
		component['updateChunkSize']();
		expect(component['chunkSize']).toBe(3);

		Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
		component['updateChunkSize']();
		expect(component['chunkSize']).toBe(6);

		Object.defineProperty(window, 'innerWidth', { value: 1500, configurable: true });
		component['updateChunkSize']();
		expect(component['chunkSize']).toBe(6);

		Object.defineProperty(window, 'innerWidth', { value: 1800, configurable: true });
		component['updateChunkSize']();
		expect(component['chunkSize']).toBe(12);
	});

	it('should adjust item size and chunk size on window resize', () => {
		const updateItemSizeSpy = vi.spyOn(component as unknown as Record<string, any>, 'updateItemSize');
		const updateChunkSizeSpy = vi.spyOn(component as unknown as Record<string, any>, 'updateChunkSize');
		const fetchColorsSpy = vi.spyOn(component as unknown as Record<string, any>, 'fetchColors');
		component.adjustOnWindowResize();
		expect(updateItemSizeSpy).toHaveBeenCalled();
		expect(updateChunkSizeSpy).toHaveBeenCalled();
		expect(fetchColorsSpy).toHaveBeenCalled();
	});

	it('should update item size after view initialization', async () => {
		const updateItemSizeSpy = vi.spyOn(component as unknown as Record<string, any>, 'updateItemSize');
		component.ngAfterViewInit();
		// wait for microtask / view init
		await new Promise((r) => setTimeout(r, 0));
		expect(updateItemSizeSpy).toHaveBeenCalled();
	});
});
