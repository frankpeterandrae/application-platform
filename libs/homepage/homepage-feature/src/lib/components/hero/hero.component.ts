/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { BaseComponent, LOGGER_SOURCE, Scopes, TranslationDirective } from '@application-platform/shared-ui';
import { provideTranslocoScope, translateSignal } from '@jsverse/transloco';

import { featureTextModules } from '../../i18n/i18n';

/**
 * Component decorator for defining the HeroComponent.
 */
@Component({
	selector: 'homepage-feature-hero',
	templateUrl: './hero.component.html',
	styleUrl: './hero.component.scss',
	imports: [TranslationDirective],
	providers: [{ provide: LOGGER_SOURCE, useValue: 'HeroComponent' }, provideTranslocoScope(Scopes.FEATURE)]
})
export class HeroComponent extends BaseComponent {
	public readonly featureTextModules = featureTextModules;

	/**
	 * The translated paragraph text.
	 */
	public paragraph = translateSignal(featureTextModules.HeroComponent.lbl.Paragraph1);
}
