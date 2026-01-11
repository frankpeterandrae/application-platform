/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Translation } from '@jsverse/transloco';

import { setupTestingModule } from '../../../test-setup';

import { TranslocoHttpLoader } from './transloco.loader';

describe('TranslocoHttpLoader', () => {
	let loader: TranslocoHttpLoader;
	let httpMock: HttpTestingController;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [TranslocoHttpLoader]
		});

		loader = TestBed.inject(TranslocoHttpLoader);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('fetches translation file for specified language', async () => {
		const lang = 'en';
		const mockTranslation: Translation = { hello: 'Hello' };

		const p = new Promise<void>((resolve) => {
			loader.getTranslation(lang).subscribe((translation) => {
				expect(translation).toEqual(mockTranslation);
				resolve();
			});
		});

		const req = httpMock.expectOne(`/assets/i18n/${lang}.json`);
		expect(req.request.method).toBe('GET');
		req.flush(mockTranslation);
		await p;
	});

	it('handles HTTP error when fetching translation file', async () => {
		const lang = 'en';

		const p = new Promise<void>((resolve) => {
			loader.getTranslation(lang).subscribe({
				next: (): void => fail('expected an error, not translations'),
				error: (error): void => {
					expect(error.status).toBe(404);
					resolve();
				}
			});
		});

		const req = httpMock.expectOne(`/assets/i18n/${lang}.json`);
		expect(req.request.method).toBe('GET');
		req.flush('File not found', { status: 404, statusText: 'Not Found' });
		await p;
	});

	it('fetches translation file for another language', async () => {
		const lang = 'de';
		const mockTranslation: Translation = { hello: 'Hallo' };

		const p = new Promise<void>((resolve) => {
			loader.getTranslation(lang).subscribe((translation) => {
				expect(translation).toEqual(mockTranslation);
				resolve();
			});
		});

		const req = httpMock.expectOne(`/assets/i18n/${lang}.json`);
		expect(req.request.method).toBe('GET');
		req.flush(mockTranslation);
		await p;
	});
});
