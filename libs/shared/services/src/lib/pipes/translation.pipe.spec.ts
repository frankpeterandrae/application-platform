/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import { TranslationPipe } from './translation.pipe';

describe('TranslationPipe', () => {
	let pipe: TranslationPipe;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [TranslationPipe]
		});

		pipe = TestBed.inject(TranslationPipe);
	});

	it('transforms key with undefined scope to translated string', () => {
		const key = 'hello';
		const scope = undefined;
		const params = {};
		const translatedValue = 'hello';

		pipe.transform(key, scope, params).subscribe((result) => {
			expect(result).toBe(translatedValue);
		});
	});
});
