/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { ScopedTranslationService } from './scoped-translation.service';
import { TranslocoService } from '@jsverse/transloco';
import { ScopedTranslationServiceInterface } from '@angular-apps/interfaces';
import { setupTestingModule } from '../../../test-setup';

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
