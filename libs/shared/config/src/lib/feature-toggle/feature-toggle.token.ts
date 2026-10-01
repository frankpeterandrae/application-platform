/*
 * Copyright (c) 2026-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { InjectionToken } from '@angular/core';

import type { FeatureToggles } from './feature-toggle.model';

/**
 * Provides the application's feature-toggle configuration.
 *
 * Features that are not explicitly configured are disabled by default.
 */
export const FEATURE_TOGGLES = new InjectionToken<FeatureToggles>('FEATURE_TOGGLES', {
	providedIn: 'root',
	factory: (): FeatureToggles => ({})
});
