/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { DialogService, DialogType } from '@application-platform/shared/ui-theme';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { ColorDetailsComponent } from '../color-details/color-details.component';
import type { RackColor } from '../models/color.model';

import { ColorGridComponent } from './color-grid.component';

describe('ColorGridComponent', () => {
	it('renders distinct buttons for paints sharing a name and opens the selected paint', async () => {
		const open = vi.fn();
		await setupTestingModule({
			imports: [ColorGridComponent],
			providers: [{ provide: DialogService, useValue: { open } }]
		});

		const first: RackColor = {
			name: 'Red',
			sku: '001',
			alternativeNames: [],
			type: 'M',
			mainColor: '#ff0000',
			row: 1,
			column: 1,
			searchTerms: [],
			paint: {
				id: 'two-thin-coats:001',
				brand: 'two-thin-coats',
				sku: '001',
				name: 'Red',
				mainColor: '#ff0000',
				colorGroups: []
			}
		};
		const second: RackColor = { ...first, sku: '002', row: 2, paint: { ...first.paint, id: 'two-thin-coats:002', sku: '002' } };
		const fixture = TestBed.createComponent(ColorGridComponent);
		fixture.componentRef.setInput('colors', [first, second]);
		fixture.detectChanges();

		const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
		expect(buttons).toHaveLength(2);
		expect(buttons[0].querySelector('fpa-shared-ui-paint-swatch svg stop')?.getAttribute('stop-color')).toBe('#ff0000');
		expect(buttons[1].textContent).toContain('2 - 1');

		buttons[1].click();
		expect(open).toHaveBeenCalledWith(ColorDetailsComponent, {
			componentData: second,
			settings: { title: 'Red', type: DialogType.INFO }
		});
	});
});
