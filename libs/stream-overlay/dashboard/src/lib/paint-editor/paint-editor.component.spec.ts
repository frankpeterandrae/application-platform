/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import type { Paint } from '@application-platform/paint';
import { PaintApiService } from '@application-platform/stream-overlay-paint-api';
import { of, throwError } from 'rxjs';
import { assert, vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { PaintEditorComponent } from './paint-editor.component';

describe('PaintEditorComponent', () => {
	let component: PaintEditorComponent;
	let fixture: ComponentFixture<PaintEditorComponent>;

	const paint: Paint = {
		id: 'two-thin-coats:21-03',
		brand: 'two-thin-coats',
		sku: '21-03',
		name: 'Berserker Red',
		mainColor: '#991115',
		matchColor: ['Word Bearers Red (GW)'],
		colorGroups: ['red']
	};

	const paintApiService = {
		getBrands: vi.fn(() => of([])),
		getPaints: vi.fn(() => of([paint])),
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

	it('should load, add and clear alternative paints', () => {
		paintApiService.updatePaint.mockReturnValue(of(paint));
		const editor = fixture.nativeElement as HTMLElement;
		const paintButton = editor.querySelector<HTMLButtonElement>('.sto-paint-editor__item');
		assert(paintButton);
		paintButton.click();
		fixture.detectChanges();

		const input = editor.querySelector<HTMLTextAreaElement>('#paint_match_color');
		const form = editor.querySelector('form');
		assert(input);
		assert(form);
		expect(input.value).toBe('Word Bearers Red (GW)');

		const submit = (value: string): void => {
			input.value = value;
			input.dispatchEvent(new Event('input'));
			form.dispatchEvent(new Event('submit'));
			fixture.detectChanges();
		};

		submit('Word Bearers Red (GW)\n\n Chaotic Red (AP) \nNocturnal Red (VGC)');
		submit(' \n');
		expect(paintApiService.updatePaint).toHaveBeenCalledTimes(2);
		expect(paintApiService.updatePaint).toHaveBeenNthCalledWith(1, {
			...paint,
			matchColor: ['Word Bearers Red (GW)', 'Chaotic Red (AP)', 'Nocturnal Red (VGC)']
		});
		expect(paintApiService.updatePaint.mock.calls[1][0]).not.toHaveProperty('matchColor');
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
