/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Import necessary modules and services.
 */
import type { Type } from '@angular/core';
import type { Route } from '@angular/router';
import { environment } from '@application-platform/config';
import { EnvGuard, Scopes } from '@application-platform/shared-ui';
import { provideTranslocoScope } from '@jsverse/transloco';

/**
 * Development-specific routes.
 * These routes are only included when the application is not in production mode.
 */
const devRoutes: Route[] = [
	{
		path: 'dev',
		children: [
			{
				path: 'test',
				/**
				 * Lazy loads the Error404Component for the test route.
				 * @returns {Promise<Type<unknown>>} A promise that resolves to the Error404Component.
				 */
				loadComponent: () => import('@application-platform/homepage-feature').then((m) => m.Error404Component),
				canActivate: [EnvGuard]
			}
		]
	}
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
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the HomeComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('@application-platform/homepage-feature').then((m) => m.HomeComponent)
	},
	{
		path: 'paint-rack',
		/**
		 * Lazy loads the ColorSearchContainerComponent for the paint rack route.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the ColorSearchContainerComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> =>
			import('@application-platform/colour-rack').then((m) => m.ColorSearchContainerComponent),
		providers: [provideTranslocoScope(Scopes.COLOR_RACK)]
	},
	...(environment.production ? [] : devRoutes),
	{
		path: '**',
		/**
		 * Lazy loads the Error404Component for handling unknown routes.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the Error404Component.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('@application-platform/homepage-feature').then((m) => m.Error404Component)
	}
];
