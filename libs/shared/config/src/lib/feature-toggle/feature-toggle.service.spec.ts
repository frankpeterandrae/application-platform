/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { TestBed } from '@angular/core/testing';

import { FeatureToggleService } from './feature-toggle.service';
import { FEATURE_TOGGLES } from './feature-toggle.token';

describe('FeatureToggleService', () => {
	it('should return true for enabled features', () => {
		TestBed.configureTestingModule({
			providers: [
				{
					provide: FEATURE_TOGGLES,
					useValue: {
						'starmap.renderer3d': true
					}
				}
			]
		});

		const service = TestBed.inject(FeatureToggleService);

		expect(service.isEnabled('starmap.renderer3d')).toBe(true);
	});

	it('should return false for disabled features', () => {
		TestBed.configureTestingModule({
			providers: [
				{
					provide: FEATURE_TOGGLES,
					useValue: {
						'starmap.renderer3d': false
					}
				}
			]
		});

		const service = TestBed.inject(FeatureToggleService);

		expect(service.isEnabled('starmap.renderer3d')).toBe(false);
	});

	it('should return false for unknown features', () => {
		TestBed.configureTestingModule({
			providers: [
				{
					provide: FEATURE_TOGGLES,
					useValue: {}
				}
			]
		});

		const service = TestBed.inject(FeatureToggleService);

		expect(service.isEnabled('unknown.feature')).toBe(false);
	});
});
