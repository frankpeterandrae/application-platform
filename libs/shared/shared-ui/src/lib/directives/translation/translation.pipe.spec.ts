/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { TranslocoService, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { TranslationPipe } from './translation.pipe';

describe('TranslationPipe', () => {
	let pipe: TranslationPipe;
	let translocoService: any;

	beforeEach(async () => {
		translocoService = {
			selectTranslate: vi.fn().mockReturnValue(of('test')),
			getActiveLang: vi.fn().mockReturnValue('en')
		};

		await setupTestingModule({
			providers: [
				TranslationPipe,
				{ provide: TranslocoService, useValue: translocoService },
				{ provide: TRANSLOCO_SCOPE, useValue: null }
			]
		});

		pipe = TestBed.inject(TranslationPipe);
	});

	it('should create an instance', () => {
		expect(pipe).toBeTruthy();
	});

	it('should subscribe to selectTranslate and return translated value', () => {
		translocoService.selectTranslate.mockReturnValue(of('Translated Value'));

		const result = pipe.transform('test.key');

		expect(translocoService.selectTranslate).toHaveBeenCalledWith('test.key', undefined, undefined);
		expect(result).toBe('Translated Value');
	});

	it('should handle parameters in translation', () => {
		const params = { name: 'John' };
		translocoService.selectTranslate.mockReturnValue(of('Hello John'));

		const result = pipe.transform('greeting', undefined, params);

		expect(translocoService.selectTranslate).toHaveBeenCalledWith('greeting', params, undefined);
		expect(result).toBe('Hello John');
	});

	it('should handle scope as string', () => {
		translocoService.selectTranslate.mockReturnValue(of('Scoped Translation'));

		const result = pipe.transform('test.key', 'custom-scope');

		expect(translocoService.selectTranslate).toHaveBeenCalledWith('test.key', undefined, { scope: 'custom-scope' });
		expect(result).toBe('Scoped Translation');
	});

	it('should handle scope as array', () => {
		translocoService.selectTranslate.mockReturnValue(of('Array Scope Translation'));

		const result = pipe.transform('test.key', ['scope1', 'scope2']);

		expect(translocoService.selectTranslate).toHaveBeenCalledWith('test.key', undefined, { scope: 'scope1' });
		expect(result).toBe('Array Scope Translation');
	});

	it('should only resubscribe when inputs change', () => {
		translocoService.selectTranslate.mockReturnValue(of('Translation'));

		pipe.transform('test.key');
		pipe.transform('test.key'); // Same key

		// Should only subscribe once since key hasn't changed
		expect(translocoService.selectTranslate).toHaveBeenCalledTimes(1);
	});

	it('should resubscribe when key changes', () => {
		translocoService.selectTranslate.mockReturnValue(of('Translation'));

		pipe.transform('key1');
		pipe.transform('key2');

		expect(translocoService.selectTranslate).toHaveBeenCalledTimes(2);
	});

	it('should handle translation value updates', () => {
		translocoService.selectTranslate.mockReturnValueOnce(of('First'));

		const result = pipe.transform('test.key');

		expect(result).toBe('First');
	});

	it('should cleanup subscription on destroy', () => {
		translocoService.selectTranslate.mockReturnValue(of('Translation'));

		pipe.transform('test.key');

		// Just verify ngOnDestroy doesn't throw
		expect(() => pipe.ngOnDestroy()).not.toThrow();
	});
});
