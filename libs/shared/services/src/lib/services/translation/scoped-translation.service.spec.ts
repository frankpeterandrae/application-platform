/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import type { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { setupTestingModule } from '../../../test-setup';

import { ScopedTranslationService } from './scoped-translation.service';

describe('ScopedTranslationService', () => {
	let service: ScopedTranslationServiceInterface;
	let translocoService: jest.Mocked<TranslocoService>;

	beforeEach(async () => {
		const translocoServiceMock = {
			setActiveLang: jest.fn(),
			selectTranslate: jest.fn(),
			getAvailableLangs: jest.fn(),
			getActiveLang: jest.fn()
		};

		await setupTestingModule({
			providers: [ScopedTranslationService, { provide: TranslocoService, useValue: translocoServiceMock }]
		});

		service = TestBed.inject(ScopedTranslationService);
		translocoService = TestBed.inject(TranslocoService) as jest.Mocked<TranslocoService>;
	});

	it('translates a key within a scope', (done) => {
		const key = 'hello';
		const scope = 'common';
		const params = {};
		const translatedValue = 'Hallo';

		translocoService.selectTranslate.mockReturnValue(of(translatedValue));

		service.selectTranslate(key, scope, params).subscribe((result) => {
			expect(result).toBe(translatedValue);
			done();
		});
	});

	it('translates a key with parameters', (done) => {
		const key = 'greeting';
		const scope = 'common';
		const params = { name: 'John' };
		const translatedValue = 'Hallo John';

		translocoService.selectTranslate.mockReturnValue(of(translatedValue));

		service.selectTranslate(key, scope, params).subscribe((result) => {
			expect(result).toBe(translatedValue);
			done();
		});
	});

	it('translates a key with undefined scope', (done) => {
		const key = 'hello';
		const scope = undefined;
		const params = {};
		const translatedValue = 'Hallo';

		translocoService.selectTranslate.mockReturnValue(of(translatedValue));

		service.selectTranslate(key, scope, params).subscribe((result) => {
			expect(result).toBe(translatedValue);
			done();
		});
	});

	it('translates a key with null parameters', (done) => {
		const key = 'hello';
		const scope = 'common';
		const params = undefined;
		const translatedValue = 'Hallo';

		translocoService.selectTranslate.mockReturnValue(of(translatedValue));

		service.selectTranslate(key, scope, params).subscribe((result) => {
			expect(result).toBe(translatedValue);
			done();
		});
	});

	it('toggles the active language', () => {
		const availableLangs = ['en', 'de'];
		translocoService.getAvailableLangs.mockReturnValue(availableLangs);
		translocoService.getActiveLang.mockReturnValue('en');

		service.toggleLanguage();

		expect(translocoService.setActiveLang).toHaveBeenCalledWith('de');
	});

	it('updates the current language signal', () => {
		const currentLang = 'de';
		translocoService.getActiveLang.mockReturnValue(currentLang);

		service.getActiveLang();

		expect(service.currentLang()).toBe(currentLang);
	});
});
