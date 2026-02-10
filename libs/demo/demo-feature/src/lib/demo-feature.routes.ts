/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Type } from '@angular/core';
import type { Route } from '@angular/router';

export const demoFeatureRoutes: Route[] = [
	{
		path: '',
		redirectTo: 'button',
		pathMatch: 'full'
	},
	{
		path: 'button',
		/**
		 * Lazy loads the DemoButtonComponent from the demo-feature module.
		 * @returns { Promise<Type<unknown>>} A promise that resolves to the DemoButtonComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./electrons/button/button-demo.component').then((m) => m.ButtonDemoComponent)
	},
	{
		path: 'button-bar',
		/**
		 * Lazy loads the ButtonBarDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the ButtonBarDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> =>
			import('./electrons/button-bar/button-bar-demo.component').then((m) => m.ButtonBarDemoComponent)
	},
	{
		path: 'card',
		/**
		 * Lazy loads the CardDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the CardDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./atoms/card/card-demo.component').then((m) => m.CardDemoComponent)
	},
	{
		path: 'checkbox',
		/**
		 * Lazy loads the CheckboxDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the CheckboxDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./atoms/checkbox/checkbox-demo.component').then((m) => m.CheckboxDemoComponent)
	},
	{
		path: 'dialog',
		/**
		 * Lazy loads the DialogDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the DialogDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./molecules/dialog/dialog-demo.component').then((m) => m.DialogDemoComponent)
	},
	{
		path: 'dropdown-select',
		/**
		 * Lazy loads the DropdownDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the DropdownDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> =>
			import('./molecules/dropdown/dropdown-demo.component').then((m) => m.DropdownDemoComponent)
	},
	{
		path: 'colors',
		/**
		 * Lazy loads the ColorsComponent from the demo-feature module.
		 * @returns { Promise<Type<unknown>>} A promise that resolves to the ColorsComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./electrons/colors/colors.component').then((m) => m.ColorsComponent)
	},
	{
		path: 'icons',
		/**
		 * Lazy loads the IconsDemoComponent from the demo-feature module.
		 * @returns { Promise<Type<unknown>>} A promise that resolves to the IconsDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./electrons/icon/icon-demo.component').then((m) => m.IconDemoComponent)
	},
	{
		path: 'image-loader',
		/**
		 * Lazy loads the ImageLoaderDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the ImageLoaderDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> =>
			import('./atoms/image-loader/image-loader.component').then((m) => m.ImageLoaderDemoComponent)
	},
	{
		path: 'input',
		/**
		 * Lazy loads the InputDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the InputDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./atoms/input/input-demo.component').then((m) => m.InputDemoComponent)
	},
	{
		path: 'language-toggle',
		/**
		 * Lazy loads the LanguageToggleDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the LanguageToggleDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> =>
			import('./molecules/language-toggle/language-toggle-demo.component').then((m) => m.LanguageToggleDemoComponent)
	},
	{
		path: 'login',
		/**
		 * Lazy loads the LoginDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the LoginDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./molecules/login/login-demo.component').then((m) => m.LoginDemoComponent)
	},
	{
		path: 'range-input',
		/**
		 * Lazy loads the RangeInputDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the RangeInputDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> =>
			import('./atoms/range-input/range-input-demo.component').then((m) => m.RangeInputDemoComponent)
	},
	{
		path: 'select',
		/**
		 * Lazy loads the SelectDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the SelectDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./atoms/select/select-demo.component').then((m) => m.SelectDemoComponent)
	},
	{
		path: 'tabs',
		/**
		 * Lazy loads the TabsDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the TabsDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./molecules/tabs/tabs-demo.component').then((m) => m.TabsDemoComponent)
	},
	{
		path: 'textarea',
		/**
		 * Lazy loads the TextareaDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the TextareaDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./atoms/textarea/textarea-demo.component').then((m) => m.TextareaDemoComponent)
	},
	{
		path: 'tooltip',
		/**
		 * Lazy loads the TooltipDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the TooltipDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> =>
			import('./directives/tooltip/tooltip-demo.component').then((m) => m.TooltipDemoComponent)
	},
	{
		path: 'typography',
		/**
		 * Lazy loads the TypographyComponent from the demo-feature module.
		 * @returns { Promise<Type<unknown>>} A promise that resolves to the TypographyComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./typography/typography-demo.component').then((m) => m.TypographyDemoComponent)
	},
	{
		path: 'footer',
		/**
		 * Lazy loads the FooterDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the FooterDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./electrons/footer/footer-demo.component').then((m) => m.FooterDemoComponent)
	},
	{
		path: 'header',
		/**
		 * Lazy loads the HeaderDemoComponent from the demo-feature module.
		 * @returns {Promise<Type<unknown>>} A promise that resolves to the HeaderDemoComponent.
		 */
		loadComponent: (): Promise<Type<unknown>> => import('./electrons/header/header-demo.component').then((m) => m.HeaderDemoComponent)
	}
];
