/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { BrowserSvgPersistenceService, SVG_PERSISTENCE } from '@application-platform/starmap-map';

import { setupTestingModule } from '../test-setup';

import { appConfig } from './app.config';

describe('appConfig', () => {
	beforeEach(async () => {
		await setupTestingModule({
			providers: [...(appConfig.providers ?? [])]
		});
	});

	it('should provide browser SVG persistence', () => {
		const persistence = TestBed.inject(SVG_PERSISTENCE);

		const browserPersistence = TestBed.inject(BrowserSvgPersistenceService);

		expect(persistence).toBe(browserPersistence);
	});
});
