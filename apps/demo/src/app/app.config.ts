/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import { ScopedTranslationService } from '@application-platform/shared-ui';
import { provideFastSVG } from '@push-based/ngx-fast-svg';

import { appRoutes } from './app.routes';

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
		{
			provide: ScopedTranslationServiceInterface,
			useClass: ScopedTranslationService
		}
	]
};
