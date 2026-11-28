/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import asset from '../../assets/colors.json';
import { setupTestingModule } from '../../test-setup';
import type { Color } from '../models/color.model';
import { ColorService } from '../services/color.service';

import { ColorSearchContainerComponent } from './color-search-container.component';

describe('ColorSearchContainerComponent', () => {
	let fixture: ComponentFixture<ColorSearchContainerComponent>;
	const request = vi.fn<ColorService['getColors']>();
	const updateTag = vi.fn();
	const setTitle = vi.fn();

	function render(): void {
		fixture = TestBed.createComponent(ColorSearchContainerComponent);
		fixture.detectChanges();
	}

	function tiles(): HTMLButtonElement[] {
		return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.color-tile'));
	}

	function search(value: string): void {
		const input = (fixture.nativeElement as HTMLElement).querySelectorAll('input')[0];
		input.value = value;
		input.dispatchEvent(new Event('input'));
		fixture.detectChanges();
	}

	beforeEach(async () => {
		request.mockReset();
		await setupTestingModule({
			imports: [ColorSearchContainerComponent],
			providers: [
				{ provide: ColorService, useValue: { getColors: request } },
				{ provide: Meta, useValue: { updateTag } },
				{ provide: Title, useValue: { setTitle } }
			]
		});
	});

	it('renders the exported layout and preserves positions when sorting or filtering', async () => {
		request.mockReturnValue(of(asset as Color[]));
		render();

		expect(tiles()[0].textContent).toContain(asset[0].name);
		expect(tiles()[0].textContent).toContain('1 - 1');

		await fixture.whenStable();
		const [sort] = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('theme-select [role=combobox]');
		sort.click();
		fixture.detectChanges();

		const [, nameOrder] = document.querySelectorAll<HTMLButtonElement>('.cdk-overlay-container [role=option]');
		nameOrder.click();
		fixture.detectChanges();

		const firstByName = [...asset].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))[0];
		expect(tiles()[0].textContent).toContain(firstByName.name);

		const paint = asset[12];
		search(`  ${paint.sku.toUpperCase()}  `);
		expect(tiles().map((tile) => tile.textContent)).toEqual([expect.stringContaining('2 - 1')]);

		search('');
		expect(tiles()[0].textContent).toContain(firstByName.name);
		expect(request).toHaveBeenCalledOnce();
	});

	it('finds alternative names and barcodes and handles zero results', () => {
		const color: Color = {
			name: 'Blue',
			sku: '001',
			alternativeNames: ['Azure (GW)'],
			barcode: '012345',
			type: 'M',
			mainColor: '#123456'
		};
		request.mockReturnValue(of([color]));
		render();

		search('  AZURE ');
		expect(tiles()[0].textContent).toContain('Blue');
		search('012345');
		expect(tiles()).toHaveLength(1);
		search('red');
		expect(tiles()).toHaveLength(0);
		expect(fixture.nativeElement.querySelector('[role=status]')).toBeTruthy();
		expect(color).not.toHaveProperty('row');
	});

	it('bounds the rendered tiles for 2,401 colors, reaches the last page and resets paging when searching', () => {
		const colors: Color[] = Array.from({ length: 2401 }, (_, index) => ({
			name: `Paint ${index}`,
			sku: String(index),
			alternativeNames: [],
			type: 'M',
			mainColor: '#123456'
		}));
		request.mockReturnValue(of(colors));
		render();

		expect(tiles()).toHaveLength(48);
		const root = fixture.nativeElement as HTMLElement;
		const [bottomPrevious, bottomNext] = root.querySelectorAll<HTMLButtonElement>('theme-pagination:last-child button');
		expect(bottomPrevious.disabled).toBe(true);
		bottomNext.click();
		fixture.detectChanges();
		expect(tiles()[0].textContent).toContain('Paint 48');
		expect(document.activeElement).toBe(root.querySelector('[role=status]'));
		expect(bottomPrevious.disabled).toBe(false);
		bottomPrevious.click();
		fixture.detectChanges();
		expect(tiles()[0].textContent).toContain('Paint 0');
		const next = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('theme-pagination button')[1];
		for (let page = 0; page < 50; page++) {
			next.click();
			fixture.detectChanges();
		}
		expect(next.disabled).toBe(true);
		expect(tiles()).toHaveLength(1);
		expect(tiles()[0].textContent).toContain('Paint 2400');

		search('paint 1000');
		expect(tiles()).toHaveLength(1);
		expect(tiles()[0].textContent).toContain('Paint 1000');
	});

	it('shows loading and error states and retries the asset request', () => {
		const pending = new Subject<Color[]>();
		request.mockReturnValueOnce(pending).mockReturnValueOnce(of(asset as Color[]));
		render();

		expect(fixture.nativeElement.querySelector('[role=status]')).toBeTruthy();
		pending.error(new Error('load failed'));
		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
		(fixture.nativeElement as HTMLElement).querySelectorAll('button')[0].click();
		fixture.detectChanges();

		expect(tiles().length).toBeGreaterThan(0);
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('sets the page metadata', () => {
		request.mockReturnValue(of([]));
		render();

		expect(setTitle).toHaveBeenCalledWith('colourRackI18n.ColorSearchContainer.meta.Title');
		expect(updateTag).toHaveBeenCalledWith({
			name: 'description',
			content: 'colourRackI18n.ColorSearchContainer.meta.Description'
		});
	});
});
