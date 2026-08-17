/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';

/**
 * Route configuration for the stream overlay dashboard.
 */
export const dashboardRoutes: Routes = [
	{
		path: '',
		component: DashboardComponent
	},
	{
		path: 'paints',
		loadComponent: () =>
			import('./paint-selection/paint-selection.component').then(({ PaintSelectionComponent }) => PaintSelectionComponent)
	},
	{
		path: 'paint-editor',
		loadComponent: () => import('./paint-editor/paint-editor.component').then(({ PaintEditorComponent }) => PaintEditorComponent)
	},
	{
		path: 'stream-info',
		loadComponent: () => import('./stream-info/stream-info.component').then((m) => m.StreamInfoComponent)
	}
];
