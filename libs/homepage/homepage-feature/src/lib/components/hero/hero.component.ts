/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { AsyncPipe } from '@angular/common';
import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { ScopedTranslationServiceInterface } from '@application-platform/interfaces';
import { TranslationPipe } from '@application-platform/services';

/**
 * Component decorator for defining the HeroComponent.
 */
@Component({
	selector: 'homepage-feature-hero',
	templateUrl: './hero.component.html',
	styleUrl: './hero.component.scss',
	imports: [TranslationPipe, AsyncPipe]
})
export class HeroComponent implements OnInit {
	private readonly translocoService = inject(ScopedTranslationServiceInterface);

	/**
	 * The translated paragraph text.
	 */
	public paragraph: string | undefined;

	/**
	 * Initializes the component and sets the translated paragraph text.
	 */
	ngOnInit(): void {
		this.translocoService.selectTranslate('HeroComponent.lbl.Paragraph1', 'feature').subscribe((translation) => {
			this.paragraph = translation;
		});
	}
}
