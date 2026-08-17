/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Paint, PaintBrandDefinition } from '@application-platform/paint';
import { PaintApiService } from '@application-platform/paint-data-access/client';
import { PaintService } from '@application-platform/stream-overlay-data-access';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { PaintSelectionComponent } from './paint-selection.component';

describe('PaintSelectionComponent', () => {
	const brands: PaintBrandDefinition[] = [
		{
			id: 'citadel',
			label: 'Citadel'
		}
	];

	const paints: Paint[] = [
		{
			id: 'citadel:B',
			brand: 'citadel',
			sku: 'B',
			name: 'Paint B',
			mainColor: '#222222',
			colorGroups: ['blue']
		},
		{
			id: 'citadel:A',
			brand: 'citadel',
			sku: 'A',
			name: 'Paint A',
			mainColor: '#111111',
			colorGroups: ['red']
		}
	];

	const paintApiService = {
		getBrands: vi.fn(),
		getPaints: vi.fn(),
		getRecentPaints: vi.fn()
	};

	const paintService = {
		selectPaint: vi.fn()
	};

	const router = {
		navigate: vi.fn()
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		paintApiService.getBrands.mockReturnValue(of(brands));

		paintApiService.getPaints.mockReturnValue(of(paints));

		paintApiService.getRecentPaints.mockReturnValue(of([]));

		await setupTestingModule({
			imports: [PaintSelectionComponent],
			providers: [
				{
					provide: PaintApiService,
					useValue: paintApiService
				},
				{
					provide: PaintService,
					useValue: paintService
				},
				{
					provide: Router,
					useValue: router
				},
				{
					provide: ActivatedRoute,
					useValue: {}
				}
			]
		});
	});

	it('should load brands, paints and recent paints on creation', () => {
		const fixture = TestBed.createComponent(PaintSelectionComponent);

		fixture.detectChanges();

		expect(paintApiService.getBrands).toHaveBeenCalledTimes(1);

		expect(paintApiService.getPaints).toHaveBeenCalledTimes(1);

		expect(paintApiService.getRecentPaints).toHaveBeenCalledTimes(1);
	});

	it('should sort paints by sku before creating selector slots', () => {
		const fixture = TestBed.createComponent(PaintSelectionComponent);

		fixture.detectChanges();

		const component = fixture.componentInstance as any;

		component.press(8); // Citadel
		component.press(0); // Rot

		expect(component.slots()[0].button).toMatchObject({
			type: 'paint',
			label: 'Paint A'
		});
	});

	it('should ignore press when selector is not initialized', () => {
		paintApiService.getBrands.mockReturnValue(of());

		const fixture = TestBed.createComponent(PaintSelectionComponent);

		const component = fixture.componentInstance as any;

		expect(() => component.press(0)).not.toThrow();

		expect(paintService.selectPaint).not.toHaveBeenCalled();
	});

	it('should select paint and update recent paints', () => {
		paintApiService.getRecentPaints.mockReturnValue(of(['citadel:B']));

		const fixture = TestBed.createComponent(PaintSelectionComponent);

		fixture.detectChanges();

		const component = fixture.componentInstance as any;

		component.press(8); // Citadel
		component.press(0); // Rot
		component.press(0); // Paint A

		expect(paintService.selectPaint).toHaveBeenCalledWith(paints[1]);

		expect(component.slots()[0].button).toMatchObject({
			type: 'paint',
			label: 'Paint A'
		});

		expect(component.slots()[1].button).toMatchObject({
			type: 'paint',
			label: 'Paint B'
		});
	});

	it('should move an already recent paint to the front without duplicating it', () => {
		paintApiService.getRecentPaints.mockReturnValue(of(['citadel:A', 'citadel:B']));

		const fixture = TestBed.createComponent(PaintSelectionComponent);

		fixture.detectChanges();

		const component = fixture.componentInstance as any;

		component.press(8);
		component.press(1); // blau
		component.press(0); // Paint B

		const recentIds = component
			.slots()
			.slice(0, 8)
			.filter((slot: any) => slot.button.type === 'paint')
			.map((slot: any) => slot.button.paint.id);

		expect(recentIds).toEqual(['citadel:B', 'citadel:A']);
	});

	it('should navigate to dashboard on home action', () => {
		const fixture = TestBed.createComponent(PaintSelectionComponent);

		fixture.detectChanges();

		const component = fixture.componentInstance as any;

		component.press(24);

		expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
	});

	it('should keep only the eight most recent paints', () => {
		const recentPaints = Array.from({ length: 9 }, (_, index): Paint => ({
			id: `citadel:${index}`,
			brand: 'citadel',
			sku: `${index}`,
			name: `Paint ${index}`,
			mainColor: '#000000',
			colorGroups: ['red']
		}));

		paintApiService.getPaints.mockReturnValue(of(recentPaints));

		paintApiService.getRecentPaints.mockReturnValue(of(recentPaints.slice(0, 8).map((paint) => paint.id)));

		const fixture = TestBed.createComponent(PaintSelectionComponent);

		fixture.detectChanges();

		const component = fixture.componentInstance as any;

		component.press(8); // Citadel
		component.press(0); // Rot
		component.press(8); // Paint 8

		const recentIds = component
			.slots()
			.slice(0, 8)
			.filter((slot: any) => slot.button.type === 'paint')
			.map((slot: any) => slot.button.paint.id);

		expect(recentIds).toHaveLength(8);
		expect(recentIds[0]).toBe('citadel:8');
	});
});
