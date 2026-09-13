/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { InjectionToken } from '@angular/core';

import type { FeatureToggles } from './feature-toggle.model';

export const FEATURE_TOGGLES = new InjectionToken<FeatureToggles>('FEATURE_TOGGLES', {
	providedIn: 'root',
	factory: (): Readonly<Record<string, boolean>> => ({})
});
