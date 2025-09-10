/*
 * Copyright (c) 2024-2025. Frank-Peter Andrä
 * All rights reserved.
 */

import { FooterComponent, HeaderComponent, IconDefinition, LanguageToggleComponent, MenuItem } from '@angular-apps/shared/ui-theme';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BUILD_DATE, environment } from '@angular-apps/config';
import { Logger } from '@angular-apps/shared-ui';
import { Meta } from '@angular/platform-browser';
import { i18nTextModules } from './i18n/i18n';
import { translateSignal } from '@jsverse/transloco';

/**
 * The root component of the application.
 */
@Component({
	imports: [RouterOutlet, HeaderComponent, FooterComponent, LanguageToggleComponent],
	selector: 'fpa-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	private readonly meta = inject(Meta);

	private homeLabel = translateSignal(i18nTextModules.AppComponent.menu.lbl.Home);
	private paintRack = translateSignal(i18nTextModules.AppComponent.menu.lbl.PaintRack);
	private inDevelopment = translateSignal(i18nTextModules.AppComponent.menu.lbl.InDevelopment);
	private test = translateSignal(i18nTextModules.AppComponent.menu.lbl.Test);
	private imprint = translateSignal(i18nTextModules.AppComponent.menu.lbl.Imprint);
	private privacy = translateSignal(i18nTextModules.AppComponent.menu.lbl.Privacy);

	/**
	 * The menu items to be displayed in the header.
	 * Implemented as a computed signal so it reacts when translation signals change.
	 */
	public menuItems = computed<MenuItem[]>(() => [
		{
			id: 'home',
			label: this.homeLabel(),
			icon: IconDefinition.HOUSE,
			route: '/'
		},
		{
			id: 'paint-rack',
			label: this.paintRack(),
			icon: IconDefinition.PALETTE,
			route: '/paint-rack'
		},
		...(!environment.production
			? [
					{
						id: 'dev',
						label: this.inDevelopment(),
						icon: IconDefinition.PALETTE,
						route: '/dev',
						children: [{ id: 'test', label: this.test(), route: '/dev/test' }]
					}
				]
			: [])
	]);

	public footerMenuItems = computed<MenuItem[]>(() => [
		{
			id: 'home',
			label: this.homeLabel(),
			icon: IconDefinition.HOUSE,
			route: '/'
		},
		{
			id: 'paint-rack',
			label: this.paintRack(),
			icon: IconDefinition.PALETTE,
			route: '/paint-rack'
		}
	]);

	/**
	 * Creates an instance of AppComponent.
	 */
	constructor() {
		this.meta.addTags([
			{ name: 'robots', content: 'index, follow' },
			{ name: 'author', content: 'Frank-Peter Andrä' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ name: 'date', content: BUILD_DATE, scheme: 'YYYY-MM-DDTHH:mm:ss.sssZ' },
			{ charset: 'UTF-8' }
		]);
	}

	/**
	 * Initializes the component and sets up the menu items with translations.
	 */
	ngOnInit(): void {
		if (environment.production) {
			Logger.setProductionMode({ disable: true });
		}
	}
}
