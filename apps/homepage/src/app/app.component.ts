/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { BUILD_DATE, environment } from '@application-platform/config';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import { Logger } from '@application-platform/services';
import type { MenuItem } from '@application-platform/shared/ui-theme';
import { FooterComponent, HeaderComponent, IconDefinition, LanguageToggleComponent } from '@application-platform/shared/ui-theme';
import { combineLatest } from 'rxjs';

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
	private readonly translocoService = inject(ScopedTranslationServiceInterface);
	private readonly meta = inject(Meta);

	/**
	 * The menu items to be displayed in the sidebar.
	 * @type {MenuItem[]}
	 */
	public menuItems: MenuItem[] = [];

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

		combineLatest([
			this.translocoService.selectTranslate('AppComponent.menu.lbl.Home'),
			this.translocoService.selectTranslate('AppComponent.menu.lbl.PaintRack'),
			this.translocoService.selectTranslate('AppComponent.menu.lbl.InDevelopment'),
			this.translocoService.selectTranslate('AppComponent.menu.lbl.Test')
		]).subscribe(([home, paintRack, inDevelopment, test]) => {
			this.initializeMenuItems(home, paintRack, inDevelopment, test);
		});
	}

	/**
	 * Initializes the menu items with the provided translations.
	 * @param {string} home - The translation for the home menu item.
	 * @param {string} paintRack - The translation for the paint rack menu item.
	 * @param {string} inDevelopment - The translation for the in development menu item.
	 * @param {string} test - The translation for the test menu item.
	 */
	private initializeMenuItems(home: string, paintRack: string, inDevelopment: string, test: string): void {
		this.menuItems = [
			{
				label: home,
				icon: IconDefinition.HOUSE,
				route: '/'
			},
			{
				label: paintRack,
				icon: IconDefinition.PALETTE,
				route: '/paint-rack'
			},
			...(environment.production
				? []
				: [
						{
							label: inDevelopment,
							icon: IconDefinition.PALETTE,
							route: '/dev',
							children: [{ label: test, route: '/dev/test' }]
						}
					])
		];
	}
}
