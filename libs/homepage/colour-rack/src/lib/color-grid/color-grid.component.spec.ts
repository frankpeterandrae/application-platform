/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogService, DialogType } from '@application-platform/shared/ui-theme';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { ColorDetailsComponent } from '../color-details/color-details.component';
import type { Color } from '../models/color.model';
import { ColorService } from '../services/color.service';

import { ColorGridComponent } from './color-grid.component';

describe('ColorGridComponent', () => {
	let fixture: ComponentFixture<ColorGridComponent>;
	let paintData: Subject<Color[]>;
	const open = vi.fn();
	const colors: Color[] = [
		{ name: 'Red', alternativeNames: ['Crimson'], type: 'M', mainColor: '#ff0000' },
		{ name: 'Blue', alternativeNames: ['Azure'], type: 'S', mainColor: '#0000ff' }
	];

	const tiles = () => (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button.color-tile');
	const dimmedTiles = () => Array.from(tiles()).filter((tile) => tile.querySelector('.grayed-out'));

	beforeEach(async () => {
		paintData = new Subject();
		open.mockClear();
		await setupTestingModule({
			imports: [ColorGridComponent],
			providers: [
				{ provide: ColorService, useValue: { getColors: () => paintData } },
				{ provide: DialogService, useValue: { open } }
			]
		});

		fixture = TestBed.createComponent(ColorGridComponent);
		fixture.detectChanges();
		// The test DOM has no layout. Give virtual scrolling a measurable viewport.
		Object.defineProperty(fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport'), 'clientHeight', { value: 600 });
		await fixture.whenStable();
	});

	async function renderColors(): Promise<void> {
		paintData.next(colors);
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
	}

	it('keeps storage positions visible and applies a query entered before the paints arrive', async () => {
		fixture.componentRef.setInput('searchQuery', 'AZURE');
		await renderColors();

		expect(Array.from(tiles(), (tile) => tile.querySelector('.storage-location')?.textContent?.trim())).toEqual(['1 - 1', '1 - 2']);
		expect(dimmedTiles()).toEqual([tiles()[0]]);

		fixture.componentRef.setInput('searchQuery', 'red');
		fixture.detectChanges();
		expect(dimmedTiles()).toEqual([tiles()[1]]);

		fixture.componentRef.setInput('searchQuery', '');
		fixture.detectChanges();
		expect(dimmedTiles()).toHaveLength(0);
	});

	it('opens details for the paint selected in the grid', async () => {
		await renderColors();

		tiles()[1].click();

		expect(open).toHaveBeenCalledExactlyOnceWith(ColorDetailsComponent, {
			componentData: { ...colors[1], row: 1, column: 2 },
			settings: { title: 'Blue', type: DialogType.INFO }
		});
	});
});
