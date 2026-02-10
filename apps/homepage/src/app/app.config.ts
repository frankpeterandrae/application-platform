/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { translocoConfigFactory } from '@application-platform/config';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import { ScopedTranslationService, TranslocoHttpLoader } from '@application-platform/shared-ui';
import { provideTransloco } from '@jsverse/transloco';
import { provideFastSVG } from '@push-based/ngx-fast-svg';

import { appRoutes } from './app.routes';

/**
 * Application configuration object.
 */
export const appConfig: ApplicationConfig = {
	providers: [
		/**
		 * Provides zone less change detection
		 */
		provideZonelessChangeDetection(),

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
		 * @param {string} path - The path/name of the SVG file.
		 * Can be in format 'icon-name' (default location) or 'libName/icon-name' (library-specific location).
		 * @returns {string} The URL to the SVG file.
		 */
		provideFastSVG({
			/**
			 * Generates the URL for the SVG file.
			 * Supports library-specific paths like 'libA/icon-name' or default paths like 'icon-name'.
			 * @param {string} path - The path/name of the SVG file.
			 * @returns {string} The URL to the SVG file.
			 */
			url: (path: string) => {
				// If path contains a slash, it's already a library-specific path (e.g., 'libA/icon-name')
				// Otherwise, assume default svg assets location (e.g., 'icon-name' -> 'svg/icon-name')
				return path.includes('/') ? `/assets/${path}.svg` : `/assets/svg/${path}.svg`;
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
