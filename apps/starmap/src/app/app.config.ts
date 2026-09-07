/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BrowserSvgPersistenceService, SVG_PERSISTENCE } from '@application-platform/starmap-map';
import { provideFastSVG } from '@push-based/ngx-fast-svg';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(appRoutes),

		provideFastSVG({
			url: (path: string) => {
				return path.includes('/') ? `/assets/${path}.svg` : `/assets/svg/${path}.svg`;
			}
		}),

		BrowserSvgPersistenceService,
		{
			provide: SVG_PERSISTENCE,
			useExisting: BrowserSvgPersistenceService
		}
	]
};
