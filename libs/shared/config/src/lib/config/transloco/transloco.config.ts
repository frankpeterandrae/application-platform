/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { TranslocoConfig } from '@jsverse/transloco';
import { translocoConfig } from '@jsverse/transloco';

/**
 * Creates a Transloco configuration object based on the provided production flag.
 * @param production - A boolean indicating whether the application is in production mode.
 * @returns A TranslocoConfig object configured with available languages, default language, and production mode.
 */
export function createTranslocoConfig(production: boolean): TranslocoConfig {
	return translocoConfig({
		availableLangs: ['en', 'de'],
		defaultLang: 'de',
		reRenderOnLangChange: true,
		prodMode: production
	});
}
