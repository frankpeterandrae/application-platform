/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { TranslocoConfig } from '@jsverse/transloco';
import { translocoConfig } from '@jsverse/transloco';

import { environment } from '../environments/environment';

export const translocoConfigFactory: TranslocoConfig = translocoConfig({
	availableLangs: ['en', 'de'],
	defaultLang: 'de',
	reRenderOnLangChange: true,
	prodMode: environment.production
});
