/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import type { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import type { Mocked } from '@application-platform/testing';
import { createMock } from '@application-platform/testing';
import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { ScopedTranslationService } from './scoped-translation.service';

describe('ScopedTranslationService', () => {
	let service: ScopedTranslationServiceInterface;
	let translocoService: Mocked<TranslocoService>;

	beforeEach(async () => {
		const translocoServiceMock = createMock<TranslocoService>({
			setActiveLang: vi.fn(),
			selectTranslate: vi.fn(),
			getAvailableLangs: vi.fn(),
			getActiveLang: vi.fn()
		});

		await setupTestingModule({
			providers: [ScopedTranslationService, { provide: TranslocoService, useValue: translocoServiceMock }]
		});

		service = TestBed.inject(ScopedTranslationService);
		translocoService = TestBed.inject(TranslocoService) as Mocked<TranslocoService>;
	});

	it('toggles the active language', () => {
		const availableLangs = ['en', 'de'];
		vi.spyOn(translocoService as any, 'getAvailableLangs').mockReturnValue(availableLangs);
		vi.spyOn(translocoService as any, 'getActiveLang').mockReturnValue('en');

		service.toggleLanguage();

		expect(translocoService.setActiveLang).toHaveBeenCalledWith('de');
	});

	it('updates the current language signal', () => {
		const currentLang = 'de';
		vi.spyOn(translocoService as any, 'getActiveLang').mockReturnValue(currentLang);

		service.getActiveLang();

		expect(service.currentLang()).toBe(currentLang);
	});
});
