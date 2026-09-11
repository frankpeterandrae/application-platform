/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../test-setup';

import { appConfig } from './app.config';

describe('appConfig', () => {
	beforeEach(async () => {
		await setupTestingModule({
			providers: [...(appConfig.providers ?? [])]
		});
	});

	it('should provide HttpClient', () => {
		const http = TestBed.inject(HttpClient);

		expect(http).toBeTruthy();
	});
});
