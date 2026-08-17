/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Routes } from '@angular/router';

/**
 * Route configuration for the stream overlay UI application.
 */
export const appRoutes: Routes = [
	{
		path: 'dashboard',
		loadChildren: () => import('@application-platform/stream-overlay-dashboard').then(({ dashboardRoutes }) => dashboardRoutes)
	},
	{
		path: 'overlay',
		loadChildren: () => import('@application-platform/stream-overlay').then(({ overlayRoutes }) => overlayRoutes)
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard'
	}
];
