/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import type { FeatureToggles } from './feature-toggle.model';
import { FeatureToggleService } from './feature-toggle.service';
import { FEATURE_TOGGLES } from './feature-toggle.token';

describe('FeatureToggleService', () => {
	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	async function createService(toggles: FeatureToggles): Promise<FeatureToggleService> {
		await setupTestingModule({
			providers: [
				{
					provide: FEATURE_TOGGLES,
					useValue: toggles
				}
			]
		});

		return TestBed.inject(FeatureToggleService);
	}

	it('should return true for enabled features', async () => {
		const service = await createService({
			'starmap.renderer3d': true
		});

		expect(service.isEnabled('starmap.renderer3d')).toBe(true);
	});

	it('should return false for disabled features', async () => {
		const service = await createService({
			'starmap.renderer3d': false
		});

		expect(service.isEnabled('starmap.renderer3d')).toBe(false);
	});

	it('should return false for unknown features', async () => {
		const service = await createService({});

		expect(service.isEnabled('unknown.feature')).toBe(false);
	});
});
