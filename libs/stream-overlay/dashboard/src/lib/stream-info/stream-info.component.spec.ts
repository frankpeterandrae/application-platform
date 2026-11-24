/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { StreamState } from '@application-platform/interfaces';
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
				provideHttpClient(),
				provideHttpClientTesting(),
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

	it('loads the Twitch title as a draft and preserves the subtitle until the form is submitted', () => {
		const element = fixture.nativeElement as HTMLElement;
		const inputs = element.querySelectorAll<HTMLInputElement>('input');
		const twitchButton = element.querySelector<HTMLButtonElement>('button[type="button"]')!;
		const http = TestBed.inject(HttpTestingController);
		setInputValue(inputs[1], 'Lokaler Untertitel');
		twitchButton.click();
		http.expectOne({ method: 'GET', url: '/api/twitch/stream-title' }).flush({ title: 'Titel von Twitch' });
		fixture.detectChanges();

		expect(inputs[0].value).toBe('Titel von Twitch');
		expect(inputs[1].value).toBe('Lokaler Untertitel');
		expect(streamStateService.updateState).not.toHaveBeenCalled();
		element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
		expect(streamStateService.updateState).toHaveBeenCalledWith({ title: 'Titel von Twitch', subtitle: 'Lokaler Untertitel' });
		http.verify();
	});

	it('keeps a more recent local edit when the Twitch response arrives', () => {
		const element = fixture.nativeElement as HTMLElement;
		const titleInput = element.querySelector<HTMLInputElement>('theme-input[formcontrolname="title"] input')!;
		const http = TestBed.inject(HttpTestingController);
		element.querySelector<HTMLButtonElement>('button[type="button"]')!.click();
		const request = http.expectOne('/api/twitch/stream-title');
		setInputValue(titleInput, 'Neuer Entwurf');
		request.flush({ title: 'Titel von Twitch' });
		fixture.detectChanges();

		expect(titleInput.value).toBe('Neuer Entwurf');
		expect(element.querySelector('output')?.textContent).toContain('inzwischen bearbeitet');
		http.verify();
	});

	it.each([
		[404, 'keinen Titel'],
		[429, 'Anfragelimit'],
		[503, 'Twitch-Verbindung ist nicht verfügbar'],
		[502, 'konnte nicht geladen werden']
	])('keeps the draft and displays a helpful message on HTTP %i', (status, message) => {
		const element = fixture.nativeElement as HTMLElement;
		const titleInput = element.querySelector<HTMLInputElement>('theme-input[formcontrolname="title"] input')!;
		const button = element.querySelector<HTMLButtonElement>('button[type="button"]')!;
		const http = TestBed.inject(HttpTestingController);
		setInputValue(titleInput, 'Lokaler Titel');
		button.click();
		fixture.detectChanges();
		expect(button.disabled).toBe(true);
		http.expectOne('/api/twitch/stream-title').flush(null, { status, statusText: 'Error' });
		fixture.detectChanges();

		expect(titleInput.value).toBe('Lokaler Titel');
		expect(element.querySelector('output')?.textContent).toContain(message);
		expect(button.disabled).toBe(false);
		http.verify();
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
