/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Type } from '@angular/core';
import type { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{ path: '', redirectTo: 'button', pathMatch: 'full' },
	{
		path: 'button',
		/**
		 * Lazy loads the DemoButtonComponent from the demo-feature module.
		 * @returns { Promise<Type<unknown>>} A promise that resolves to the DemoButtonComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('@application-platform/demo-feature').then((m) => m.ButtonDemoComponent)
	},
	{
		path: 'checkbox',
		/**
		 * Lazy loads the CheckboxDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the CheckboxDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('@application-platform/demo-feature').then((m) => m.CheckboxDemoComponent)
	},
	{
		path: 'colors',
		/**
		 * Lazy loads the ColorsComponent from the demo-feature module.
		 * @returns { Promise<Type<unknown>>} A promise that resolves to the ColorsComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('@application-platform/demo-feature').then((m) => m.ColorsComponent)
	},
	{
		path: 'icons',
		/**
		 * Lazy loads the IconsDemoComponent from the demo-feature module.
		 * @returns { Promise<Type<unknown>>} A promise that resolves to the IconsDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('@application-platform/demo-feature').then((m) => m.IconDemoComponent)
	},
	{
		path: 'typography',
		/**
		 * Lazy loads the TypographyComponent from the demo-feature module.
		 * @returns { Promise<Type<unknown>>} A promise that resolves to the TypographyComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('@application-platform/demo-feature').then((m) => m.TypographyDemoComponent)
	}
];
