/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import type { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import type { Mocked } from '@application-platform/testing';
import { createMock } from '@application-platform/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { vi } from 'vitest';

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

	it('translates a key within a scope', async () => {
		const key = 'hello';
		const scope = 'common';
		const params = {};
		const translatedValue = 'Hallo';

		translocoService.selectTranslate.mockReturnValue(of(translatedValue));

		await new Promise<void>((resolve) => {
			service.selectTranslate(key, scope, params).subscribe((result) => {
				expect(result).toBe(translatedValue);
				resolve();
			});
		});
	});

	it('translates a key with parameters', async () => {
		const key = 'greeting';
		const scope = 'common';
		const params = { name: 'John' };
		const translatedValue = 'Hallo John';

		translocoService.selectTranslate.mockReturnValue(of(translatedValue));

		await new Promise<void>((resolve) => {
			service.selectTranslate(key, scope, params).subscribe((result) => {
				expect(result).toBe(translatedValue);
				resolve();
			});
		});
	});

	it('translates a key with undefined scope', async () => {
		const key = 'hello';
		const scope = undefined;
		const params = {};
		const translatedValue = 'Hallo';

		translocoService.selectTranslate.mockReturnValue(of(translatedValue));

		await new Promise<void>((resolve) => {
			service.selectTranslate(key, scope, params).subscribe((result) => {
				expect(result).toBe(translatedValue);
				resolve();
			});
		});
	});

	it('translates a key with null parameters', async () => {
		const key = 'hello';
		const scope = 'common';
		const params = undefined;
		const translatedValue = 'Hallo';

		translocoService.selectTranslate.mockReturnValue(of(translatedValue));

		await new Promise<void>((resolve) => {
			service.selectTranslate(key, scope, params).subscribe((result) => {
				expect(result).toBe(translatedValue);
				resolve();
			});
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
