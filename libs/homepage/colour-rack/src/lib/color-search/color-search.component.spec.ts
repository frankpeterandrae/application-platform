/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { assert, vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { ColorSearchComponent } from './color-search.component';

describe('ColorSearchComponent', () => {
	let fixture: ComponentFixture<ColorSearchComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ColorSearchComponent]
		});

		fixture = TestBed.createComponent(ColorSearchComponent);
		fixture.detectChanges();
	});

	it('emits entered text and a cleared search from the rendered input', () => {
		const input = (fixture.nativeElement as HTMLElement).querySelector('input');
		assert(input);
		const listener = vi.fn();
		fixture.componentInstance.searchEvent.subscribe(listener);

		input.value = 'blue';
		input.dispatchEvent(new Event('input'));
		input.value = '';
		input.dispatchEvent(new Event('input'));

		expect(listener.mock.calls).toEqual([['blue'], ['']]);
	});
});
