/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { PaintApiService } from '@application-platform/paint-data-access/client';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { PaintEditorComponent } from './paint-editor.component';

describe('PaintEditorComponent', () => {
	let component: PaintEditorComponent;
	let fixture: ComponentFixture<PaintEditorComponent>;

	const paintApiService = {
		getBrands: vi.fn(() => of([])),
		getPaints: vi.fn(() => of([])),
		createPaint: vi.fn(),
		updatePaint: vi.fn(),
		deletePaint: vi.fn()
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		await setupTestingModule({
			imports: [PaintEditorComponent],
			providers: [
				{
					provide: PaintApiService,
					useValue: paintApiService
				},
				{
					provide: ActivatedRoute,
					useValue: {}
				}
			]
		});

		fixture = TestBed.createComponent(PaintEditorComponent);

		component = fixture.componentInstance;

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should load brands and paints on creation', () => {
		expect(paintApiService.getBrands).toHaveBeenCalledTimes(1);

		expect(paintApiService.getPaints).toHaveBeenCalledTimes(1);
	});
});
