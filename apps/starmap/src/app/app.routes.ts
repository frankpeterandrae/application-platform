/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Type } from '@angular/core';
import type { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: '',
		/**
		 * Lazy loads the StarmapComponent for the home route.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the StarmapComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('@application-platform/starmap-editor').then((m) => m.StarmapEditorComponent)
	}
];
