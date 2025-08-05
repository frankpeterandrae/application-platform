/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject, OnInit } from '@angular/core';
import { HeroComponent } from '../hero/hero.component';
import { Meta, Title } from '@angular/platform-browser';
import { featureTextModules } from '../../i18n/i18n';
import { provideTranslocoScope, translateSignal } from '@jsverse/transloco';
import { BaseComponent, LOGGER_SOURCE, Scopes } from '@angular-apps/shared-ui';

/**
 * Component representing the homepage feature.
 */
@Component({
	selector: 'homepage-feature',
	imports: [HeroComponent],
	providers: [{ provide: LOGGER_SOURCE, useValue: 'HomeComponent' }, provideTranslocoScope(Scopes.FEATURE)],
	templateUrl: './home.component.html'
})
export class HomeComponent extends BaseComponent implements OnInit {
	private readonly meta = inject(Meta);
	private readonly title = inject(Title);

	private readonly metaTitle = translateSignal(featureTextModules.HomeComponent.meta.Title);
	private readonly metaDescription = translateSignal(featureTextModules.HomeComponent.meta.Description);

	/**
	 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
	 * Initializes the component by setting the title and meta description using translations.
	 */
	ngOnInit(): void {
		this.title.setTitle(this.metaTitle());
		this.meta.addTag({ name: 'description', content: this.metaDescription() });
	}
}
