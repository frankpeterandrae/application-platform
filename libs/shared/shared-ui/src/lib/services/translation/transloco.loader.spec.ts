/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TranslocoHttpLoader } from './transloco.loader';
import { Translation } from '@jsverse/transloco';
import { setupTestingModule } from '../../../test-setup';

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

	it('fetches translation file for specified language', (done) => {
		const lang = 'en';
		const mockTranslation: Translation = { hello: 'Hello' };

		loader.getTranslation(lang).subscribe((translation) => {
			expect(translation).toEqual(mockTranslation);
			done();
		});

		const req = httpMock.expectOne(`/assets/i18n/${lang}.json`);
		expect(req.request.method).toBe('GET');
		req.flush(mockTranslation);
	});

	it('handles HTTP error when fetching translation file', (done) => {
		const lang = 'en';

		loader.getTranslation(lang).subscribe({
			next: (): void => fail('expected an error, not translations'),
			error: (error): void => {
				expect(error.status).toBe(404);
				done();
			}
		});

		const req = httpMock.expectOne(`/assets/i18n/${lang}.json`);
		expect(req.request.method).toBe('GET');
		req.flush('File not found', { status: 404, statusText: 'Not Found' });
	});

	it('fetches translation file for another language', (done) => {
		const lang = 'de';
		const mockTranslation: Translation = { hello: 'Hallo' };

		loader.getTranslation(lang).subscribe((translation) => {
			expect(translation).toEqual(mockTranslation);
			done();
		});

		const req = httpMock.expectOne(`/assets/i18n/${lang}.json`);
		expect(req.request.method).toBe('GET');
		req.flush(mockTranslation);
	});
});
