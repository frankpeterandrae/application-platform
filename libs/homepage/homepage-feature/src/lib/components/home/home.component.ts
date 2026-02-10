/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BaseComponent, LOGGER_SOURCE, Scopes } from '@application-platform/shared-ui';
import { provideTranslocoScope, translateSignal } from '@jsverse/transloco';

import { i18nTextModules } from '../../i18n/i18n';
import { HeroComponent } from '../hero/hero.component';

/**
 * Component representing the homepage feature.
 */
@Component({
	selector: 'homepage-feature-home',
	imports: [HeroComponent],
	providers: [{ provide: LOGGER_SOURCE, useValue: 'HomeComponent' }, provideTranslocoScope(Scopes.HOMEPAGE_FEATURE)],
	templateUrl: './home.component.html'
})
export class HomeComponent extends BaseComponent implements OnInit {
	private readonly meta = inject(Meta);
	private readonly title = inject(Title);

	private readonly metaTitle = translateSignal(i18nTextModules.HomeComponent.meta.Title);
	private readonly metaDescription = translateSignal(i18nTextModules.HomeComponent.meta.Description);

	/**
	 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
	 * Initializes the component by setting the title and meta description using translations.
	 */
	ngOnInit(): void {
		this.title.setTitle(this.metaTitle());
		this.meta.addTag({ name: 'description', content: this.metaDescription() });
	}
}
