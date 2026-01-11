/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import { TranslationPipe } from '@application-platform/services';

import { ColorGridComponent } from '../color-grid/color-grid.component';
import { ColorSearchComponent } from '../color-search/color-search.component';

/**
 * Component for the color search container.
 */
@Component({
	selector: 'cr-color-search-container',
	templateUrl: './color-search-container.component.html',
	imports: [ColorSearchComponent, ColorGridComponent, TranslationPipe, AsyncPipe]
})
export class ColorSearchContainerComponent implements OnInit {
	private readonly meta = inject(Meta);
	private readonly title = inject(Title);
	private readonly translocoService = inject(ScopedTranslationServiceInterface);

	/**
	 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
	 * Initializes the component by setting the title and meta description using translations.
	 */
	ngOnInit(): void {
		this.translocoService.selectTranslate('ColorSearchContainerComponent.meta.Title', 'color-rack').subscribe((translation) => {
			this.title.setTitle(translation);
		});

		this.translocoService.selectTranslate('ColorSearchContainerComponent.meta.Description', 'color-rack').subscribe((translation) => {
			this.meta.addTag({ name: 'description', content: translation });
		});
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
