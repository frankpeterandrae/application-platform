/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient, withXhr } from '@angular/common/http';
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
 * Application configuration for the stream overlay UI.
 */
export const appConfig: ApplicationConfig = {
	providers: [
		/**
		 * Enables zoneless Angular change detection.
		 */
		provideZonelessChangeDetection(),

		/**
		 * Registers the application routes.
		 */
		provideRouter(appRoutes),

		/**
		 * Provides the HTTP client used by API and translation loaders.
		 */
		provideHttpClient(withXhr()),

		/**
		 * Configures SVG asset URL resolution.
		 */
		provideFastSVG({
			/**
			 * Resolves an SVG name to its asset URL.
			 *
			 * Library-specific paths are loaded directly below `/assets`, while
			 * unqualified icon names are loaded from `/assets/svg`.
			 *
			 * @param path The SVG name or library-specific path.
			 * @returns The resolved SVG asset URL.
			 */
			url: (path: string) => {
				return path.includes('/') ? `/assets/${path}.svg` : `/assets/svg/${path}.svg`;
			}
		}),

		/**
		 * Registers the Transloco configuration and translation loader.
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
