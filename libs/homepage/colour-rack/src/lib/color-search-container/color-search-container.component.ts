/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LOGGER_SOURCE, Scopes, TranslationDirective } from '@application-platform/shared-ui';
import { provideTranslocoScope, translateSignal } from '@jsverse/transloco';

import { ColorGridComponent } from '../color-grid/color-grid.component';
import { ColorSearchComponent } from '../color-search/color-search.component';
import { i18nTextModules } from '../i18n/i18n';

/**
 * Component for the color search container.
 */
@Component({
	selector: 'cr-color-search-container',
	templateUrl: './color-search-container.component.html',
	imports: [ColorSearchComponent, ColorGridComponent, TranslationDirective],
	providers: [{ provide: LOGGER_SOURCE, useValue: 'ColorSearchContainerComponent' }, provideTranslocoScope(Scopes.COLOUR_RACK)]
})
export class ColorSearchContainerComponent implements OnInit {
	private readonly meta = inject(Meta);
	private readonly title = inject(Title);
	public readonly i18nTextModules = i18nTextModules;

	private readonly metaTitle = translateSignal(i18nTextModules.ColorSearchContainerComponent.meta.Title);
	private readonly metaDescription = translateSignal(i18nTextModules.ColorSearchContainerComponent.meta.Description);

	/**
	 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
	 * Initializes the component by setting the title and meta description using translations.
	 */
	ngOnInit(): void {
		this.title.setTitle(this.metaTitle());
		this.meta.addTag({ name: 'description', content: this.metaDescription() });
	}

	/**
	 * Signal to hold the search query.
	 */
	public searchQuery = signal('');

	/**
	 * Updates the search query signal with the provided query.
	 * @param {string} query - The new search query string.
	 */
	public updateSearchQuery(query: string): void {
		this.searchQuery.set(query);
	}
}
