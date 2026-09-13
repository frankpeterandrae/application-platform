/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { inject, Injectable } from '@angular/core';

import { FEATURE_TOGGLES } from './feature-toggle.token';

/**
 * Provides access to application feature toggles.
 */
@Injectable({
	providedIn: 'root'
})
export class FeatureToggleService {
	private readonly toggles = inject(FEATURE_TOGGLES);

	/**
	 * Checks whether a feature is enabled.
	 *
	 * @param feature Feature identifier.
	 * @returns Whether the feature is enabled.
	 */
	public isEnabled(feature: string): boolean {
		return this.toggles[feature] ?? false;
	}
}
