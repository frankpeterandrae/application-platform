/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type TranslocoConfig, translocoConfig } from '@jsverse/transloco';

/**
 * Creates the shared Transloco configuration.
 *
 * @param production Whether production mode is enabled.
 * @returns The application-wide Transloco configuration.
 */
export function createTranslocoConfig(production: boolean): TranslocoConfig {
	return translocoConfig({
		availableLangs: ['en', 'de'],
		defaultLang: 'de',
		reRenderOnLangChange: true,
		prodMode: production
	});
}
