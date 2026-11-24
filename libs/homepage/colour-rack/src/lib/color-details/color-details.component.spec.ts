/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { OverlayRef } from '@angular/cdk/overlay';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { type DialogConfigModel, DIALOG_DATA, DialogType } from '@application-platform/shared/ui-theme';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import type { Color } from '../models/color.model';

import { ColorDetailsComponent } from './color-details.component';

describe('ColorDetailsComponent', () => {
	const defaultColor: Color = {
		name: 'Test Color',
		alternativeNames: ['Alternative One', 'Alternative Two'],
		type: 'S-ME',
		mainColor: '#123456',
		wave: '2',
		sku: '12345',
		barcode: '987654321',
		row: 3,
		column: 4
	};

	async function createFixture(color: Color = defaultColor): Promise<ComponentFixture<ColorDetailsComponent>> {
		const dialogData: DialogConfigModel<Color> = {
			componentData: color,
			settings: {
				title: 'Color Details',
				type: DialogType.INFO
			}
		};

		await setupTestingModule({
			imports: [ColorDetailsComponent],
			providers: [
				{
					provide: OverlayRef,
					useValue: {
						dispose: vi.fn()
					}
				},
				{
					provide: DIALOG_DATA,
					useValue: dialogData
				}
			]
		});

		const fixture = TestBed.createComponent(ColorDetailsComponent);

		fixture.detectChanges();

		return fixture;
	}

	it('should render the color details', async () => {
		const fixture = await createFixture();
		const text = fixture.nativeElement.textContent;

		expect(text).toContain('12345');
		expect(text).toContain('Alternative One');
		expect(text).toContain('Alternative Two');
		expect(text).toContain('Shadow-Metallic');
		expect(text).toContain('2');
		expect(text).toContain('987654321');
		expect(text).toContain('3 - 4');
	});

	it('should display Unknown for unsupported color types', async () => {
		const fixture = await createFixture({
			...defaultColor,
			type: 'UNKNOWN' as Color['type']
		});

		expect(fixture.nativeElement.textContent).toContain('Unknown');
	});

	it('should display ink colors', async () => {
		const fixture = await createFixture({
			...defaultColor,
			type: 'I'
		});

		expect(fixture.nativeElement.textContent).toContain('Ink');
	});

	it('should display Dark Arts colors', async () => {
		const fixture = await createFixture({
			...defaultColor,
			type: 'DA'
		});

		expect(fixture.nativeElement.textContent).toContain('Dark Arts');
	});

	it('should display placeholders for missing sku and barcode', async () => {
		const fixture = await createFixture({
			...defaultColor,
			sku: undefined,
			barcode: undefined
		});

		const element = fixture.nativeElement as HTMLElement;
		const values = Array.from(element.querySelectorAll<HTMLElement>('.fpa-grid-col-end-10 p')).map((item) => item.textContent?.trim());

		expect(values[0]).toBe('-');
		expect(values[5]).toBe('-');
	});
});
