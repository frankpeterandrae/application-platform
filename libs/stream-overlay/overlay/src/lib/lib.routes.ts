/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import type { Routes } from '@angular/router';

/**
 * Route configuration for the stream overlay.
 */
export const overlayRoutes: Routes = [
	{
		path: 'header',
		loadComponent: () => import('./overlay/components/header/header.component').then(({ HeaderComponent }) => HeaderComponent)
	},
	{
		path: 'current-paint',
		loadComponent: () =>
			import('./overlay/components/current-paint/current-paint.component').then(({ CurrentPaintComponent }) => CurrentPaintComponent)
	},
	{
		path: 'webcam-frame',
		loadComponent: () => import('./overlay/components/camera/camera.component').then(({ CameraComponent }) => CameraComponent)
	},
	{
		path: 'scene-frame',
		loadComponent: () =>
			import('./overlay/components/scene-frame/scene-frame.component').then(({ SceneFrameComponent }) => SceneFrameComponent)
	}
];
