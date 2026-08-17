/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StreamState } from '@application-platform/interfaces';
import { StreamStateService } from '@application-platform/stream-overlay-data-access';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { StreamInfoComponent } from './stream-info.component';

describe('StreamInfoComponent', () => {
	let fixture: ComponentFixture<StreamInfoComponent>;

	const title = signal<string | undefined>(undefined);
	const subtitle = signal<string | undefined>(undefined);

	const streamStateService = {
		title,
		subtitle,
		updateState: vi.fn()
	};

	beforeEach(async () => {
		title.set(undefined);
		subtitle.set(undefined);

		vi.clearAllMocks();

		await setupTestingModule({
			imports: [StreamInfoComponent],
			providers: [
				provideRouter([]),
				{
					provide: StreamStateService,
					useValue: streamStateService
				}
			]
		});

		fixture = TestBed.createComponent(StreamInfoComponent);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should initialize the form from the current stream state', () => {
		title.set('Miniaturen bemalen');
		subtitle.set('Sky Lantern');

		fixture.detectChanges();

		const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

		expect(inputs[0].value).toBe('Miniaturen bemalen');
		expect(inputs[1].value).toBe('Sky Lantern');
	});

	it('should update the form when the stream state changes', () => {
		title.set('Miniaturen bemalen');
		subtitle.set('Sky Lantern');

		fixture.detectChanges();

		title.set('Blood Angels');
		subtitle.set('Sanguinary Guard');

		fixture.detectChanges();

		const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

		expect(inputs[0].value).toBe('Blood Angels');
		expect(inputs[1].value).toBe('Sanguinary Guard');
	});

	it('should update the stream state on submit', () => {
		const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

		setInputValue(inputs[0], 'Blood Angels');
		setInputValue(inputs[1], 'Sanguinary Guard');

		fixture.detectChanges();

		const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

		form.dispatchEvent(
			new Event('submit', {
				bubbles: true,
				cancelable: true
			})
		);

		expect(streamStateService.updateState).toHaveBeenCalledWith({
			title: 'Blood Angels',
			subtitle: 'Sanguinary Guard'
		} satisfies StreamState);
	});

	it('should map empty values to undefined', () => {
		title.set('Miniaturen bemalen');
		subtitle.set('Sky Lantern');

		fixture.detectChanges();

		const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

		setInputValue(inputs[0], '');
		setInputValue(inputs[1], '');

		fixture.detectChanges();

		const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

		form.dispatchEvent(
			new Event('submit', {
				bubbles: true,
				cancelable: true
			})
		);

		expect(streamStateService.updateState).toHaveBeenCalledWith({
			title: undefined,
			subtitle: undefined
		});
	});
});

/**
 * Updates an input value and emits the corresponding DOM event.
 *
 * @param input The input element to update.
 * @param value The new input value.
 */
function setInputValue(input: HTMLInputElement, value: string): void {
	input.value = value;

	input.dispatchEvent(
		new Event('input', {
			bubbles: true
		})
	);
}
