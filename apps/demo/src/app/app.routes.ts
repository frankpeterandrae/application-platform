/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Routes } from '@angular/router';

export const appRoutes: Routes = [
	{ path: '', redirectTo: 'demo/button', pathMatch: 'full' },
	{
		path: 'demo/paint-rack',
		loadComponent: () => import('@application-platform/colour-rack').then((m) => m.ColorSearchContainerComponent)
	},
	{ path: 'demo', loadChildren: () => import('@application-platform/demo-feature').then((m) => m.demoFeatureRoutes) }
];
