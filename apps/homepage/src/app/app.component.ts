/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { BUILD_DATE, environment } from '@application-platform/config';
import type { MenuItem } from '@application-platform/shared/ui-theme';
import { FooterComponent, HeaderComponent, IconDefinition, LanguageToggleComponent } from '@application-platform/shared/ui-theme';
import { Logger } from '@application-platform/shared-ui';
import { translateSignal } from '@jsverse/transloco';

import { i18nTextModules } from './i18n/i18n';

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

	private readonly homeLabel = translateSignal(i18nTextModules.AppComponent.menu.lbl.Home);
	private readonly paintRack = translateSignal(i18nTextModules.AppComponent.menu.lbl.PaintRack);
	private readonly inDevelopment = translateSignal(i18nTextModules.AppComponent.menu.lbl.InDevelopment);
	private readonly test = translateSignal(i18nTextModules.AppComponent.menu.lbl.Test);
	private readonly demo: string = 'DEMO';

	/**
	 * The menu items are provided via a getter that reads translation signals.
	 * When the signals update (language change), Angular will re-evaluate the getter
	 * and update the bound child component.
	 */
	public get menuItems(): MenuItem[] {
		return [
			{
				id: 'home',
				label: this.homeLabel(),
				icon: IconDefinition.HOUSE,
				route: '/'
			},
			{
				id: 'paint-rack',
				label: this.paintRack(),
				icon: IconDefinition.BRUSH,
				route: '/paint-rack'
			},
			...(environment.production
				? []
				: [
						{
							id: 'dev',
							label: this.inDevelopment(),
							icon: IconDefinition.BRUSH,
							route: '/dev',
							children: [
								{ id: 'test', label: this.test(), route: '/dev/test' },
								{ id: 'demo', label: this.demo, route: '/dev/demo' }
							]
						}
					])
		];
	}

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
