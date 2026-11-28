/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, computed, inject, type OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import {
	FooterComponent,
	HeaderComponent,
	IconDefinition,
	LanguageToggleComponent,
	type MenuItem
} from '@application-platform/shared/ui-theme';
import { Logger } from '@application-platform/shared-ui';
import { translateSignal } from '@jsverse/transloco';

import { BUILD_DATE } from '../config/build-date';
import { environment } from '../environments/environment';

import { i18nTextModules } from './i18n/i18n';

/** Builds the localized navigation and registers site-wide metadata. */
@Component({
	imports: [RouterOutlet, HeaderComponent, FooterComponent, LanguageToggleComponent],
	selector: 'fpa-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	private readonly meta = inject(Meta);

	private readonly homeLabel = translateSignal(i18nTextModules.AppComponent.menu.lbl.Home);
	private readonly paintRackLabel = translateSignal(i18nTextModules.AppComponent.menu.lbl.PaintRack);
	private readonly inDevelopmentLabel = translateSignal(i18nTextModules.AppComponent.menu.lbl.InDevelopment);
	private readonly testLabel = translateSignal(i18nTextModules.AppComponent.menu.lbl.Test);

	// Keep the menu stable until a label changes through the active language.
	protected readonly menuItems = computed<MenuItem[]>(() => [
		{
			id: 'home',
			label: this.homeLabel(),
			icon: IconDefinition.HOUSE,
			route: '/'
		},
		{
			id: 'paint-rack',
			label: this.paintRackLabel(),
			icon: IconDefinition.BRUSH,
			route: '/paint-rack'
		},
		...(environment.production
			? []
			: [
					{
						id: 'dev',
						label: this.inDevelopmentLabel(),
						icon: IconDefinition.BRUSH,
						route: '/dev',
						children: [
							{ id: 'test', label: this.testLabel(), route: '/dev/test' },
							{ id: 'demo', label: 'DEMO', route: '/dev/demo' }
						]
					}
				])
	]);

	constructor() {
		this.meta.addTags([
			{ name: 'robots', content: 'index, follow' },
			{ name: 'author', content: 'Frank-Peter Andrä' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ name: 'date', content: BUILD_DATE, scheme: 'YYYY-MM-DDTHH:mm:ss.sssZ' },
			{ charset: 'UTF-8' }
		]);
	}

	ngOnInit(): void {
		if (environment.production) {
			Logger.setProductionMode({ disable: true });
		}
	}
}
