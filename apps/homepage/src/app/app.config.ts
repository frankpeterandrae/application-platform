/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideFastSVG } from '@push-based/ngx-fast-svg';
import { provideTransloco } from '@jsverse/transloco';
import { ScopedTranslationService, TranslocoHttpLoader } from '@angular-apps/shared-ui';
import { translocoConfigFactory } from '@angular-apps/config';
import { ScopedTranslationServiceInterface } from '@angular-apps/interfaces';

/**
 * Application configuration object.
 */
export const appConfig: ApplicationConfig = {
	providers: [
		/**
		 * Provides zone change detection with event coalescing enabled.
		 */
		provideZoneChangeDetection({ eventCoalescing: true }),

		/**
		 * Provides the router configuration.
		 */
		provideRouter(appRoutes),

		/**
		 * Provides the HTTP client.
		 */
		provideHttpClient(),

		/**
		 * Provides the FastSVG configuration.
		 * @param {string} name - The name of the SVG file.
		 * @returns {string} The URL to the SVG file.
		 */
		provideFastSVG({
			/**
			 * Generates the URL for the SVG file.
			 * @param {string} name - The name of the SVG file.
			 * @returns {string} The URL to the SVG file.
			 */
			url: (name: string) => {
				return `/assets/svg-assets/${name}.svg`;
			}
		}),
		/**
		 * Provides the Transloco configuration.
		 */
		provideTransloco({
			config: translocoConfigFactory,
			loader: TranslocoHttpLoader
		}),
		{
			provide: ScopedTranslationServiceInterface,
			useClass: ScopedTranslationService
		}
	]
};
