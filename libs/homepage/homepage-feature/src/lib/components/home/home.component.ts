/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';

import { HeroComponent } from '../hero/hero.component';

/**
 * Component representing the homepage feature.
 */
@Component({
	selector: 'homepage-feature-home',
	imports: [HeroComponent],
	templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
	private readonly meta = inject(Meta);
	private readonly title = inject(Title);
	private readonly translocoService = inject(ScopedTranslationServiceInterface);

	/**
	 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
	 * Initializes the component by setting the title and meta description using translations.
	 */
	ngOnInit(): void {
		this.translocoService.selectTranslate('HomeComponent.meta.Title', 'feature').subscribe((translation) => {
			this.title.setTitle(translation);
		});

		this.translocoService.selectTranslate('HomeComponent.meta.Description', 'feature').subscribe((translation) => {
			this.meta.addTag({ name: 'description', content: translation });
		});
	}
}
