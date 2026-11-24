/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { PaintApiService } from '@application-platform/stream-overlay-paint-api';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { PaintEditorComponent } from './paint-editor.component';

describe('PaintEditorComponent', () => {
	let component: PaintEditorComponent;
	let fixture: ComponentFixture<PaintEditorComponent>;

	const paintApiService = {
		getBrands: vi.fn(() => of([])),
		getPaints: vi.fn(() => of([])),
		exportPaints: vi.fn(),
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

	it('should load brands and paints on creation', () => {
		expect(paintApiService.getBrands).toHaveBeenCalledTimes(1);

		expect(paintApiService.getPaints).toHaveBeenCalledTimes(1);
	});

	it.each([
		[of(undefined), 'Farbdaten exportiert.', 'status', '3000ms'],
		[throwError(() => new Error('Export failed')), 'Export fehlgeschlagen.', 'alert', '']
	])('should show the result of a manual export', (response, message, role, animationDelay) => {
		paintApiService.exportPaints.mockReturnValueOnce(response);
		const editor = fixture.nativeElement as HTMLElement;
		const exportButton = Array.from(editor.querySelectorAll('button')).find((button) =>
			button.textContent?.includes('Farbdaten exportieren')
		);

		expect(exportButton).toBeDefined();
		exportButton?.click();
		fixture.detectChanges();

		expect(paintApiService.exportPaints).toHaveBeenCalledTimes(1);
		const notification = editor.querySelector<HTMLElement>(`theme-notification [role="${role}"]`);
		expect(notification?.textContent).toContain(message);
		expect(notification?.style.animationDelay).toBe(animationDelay);
	});
});
