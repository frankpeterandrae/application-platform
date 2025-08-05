/*
 * Copyright (c) 2024-2025. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Import necessary modules and services.
 */
import { Route } from '@angular/router';
import { environment } from '@angular-apps/config';
import { EnvGuard, Scopes } from '@angular-apps/shared-ui';
import { provideTranslocoScope } from '@jsverse/transloco';

/**
 * Development-specific routes.
 * These routes are only included when the application is not in production mode.
 */
const devRoutes: Route[] = [
	{
		path: 'dev/test',
		/**
		 * Lazy loads the Error404Component for the test route.
		 * @returns {Promise<any>} A promise that resolves to the Error404Component.
		 */
		loadComponent: () => import('@angular-apps/homepage-feature').then((m) => m.Error404Component),
		canActivate: [EnvGuard]
	}
	// Add more dev-specific routes here
];

/**
 * Application routes.
 * Includes the main routes for the application and conditionally includes development routes.
 */
export const appRoutes: Route[] = [
	{
		path: '',
		/**
		 * Lazy loads the HomeComponent for the home route.
		 * @returns {Promise<any>} A promise that resolves to the HomeComponent.
		 */
		loadComponent: (): Promise<any> => import('@angular-apps/homepage-feature').then((m) => m.HomeComponent)
	},
	{
		path: 'paint-rack',
		/**
		 * Lazy loads the ColorSearchContainerComponent for the paint rack route.
		 * @returns {Promise<any>} A promise that resolves to the ColorSearchContainerComponent.
		 */
		loadComponent: (): Promise<any> => import('@angular-apps/colour-rack').then((m) => m.ColorSearchContainerComponent),
		providers: [provideTranslocoScope(Scopes.COLOR_RACK)]
	},
	...(environment.production ? [] : devRoutes),
	{
		path: '**',
		/**
		 * Lazy loads the Error404Component for handling unknown routes.
		 * @returns {Promise<any>} A promise that resolves to the Error404Component.
		 */
		loadComponent: (): Promise<any> => import('@angular-apps/homepage-feature').then((m) => m.Error404Component)
	}
];
