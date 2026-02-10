/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TooltipDirective } from '@application-platform/shared/ui-theme';
import { Scopes, TranslationPipe } from '@application-platform/shared-ui';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * Component representing a color palette with various shades.
 */
@Component({
	selector: 'demo-colors',
	imports: [NgClass, TooltipDirective, DemoThemeContainerComponent, TranslationPipe],
	providers: [TranslationPipe],
	templateUrl: './colors.component.html',
	styleUrl: './colors.component.scss'
})
export class ColorsComponent {
	protected readonly i18nTextModules = i18nTextModules;

	private readonly translationPipe = inject(TranslationPipe);

	public description: Description = {
		title: i18nTextModules.Colors.lbl.Title,
		description: i18nTextModules.Colors.lbl.Description,
		usage:
			'<!-- Using colors with variants -->\n' +
			'<div class="fpa-bg-light-shades">Light Shades</div>\n' +
			'<div class="fpa-bg-light-shades-s5">Light Shades Shade 5</div>\n' +
			'<div class="fpa-bg-light-shades-t5">Light Shades Tint 5</div>\n\n' +
			'<!-- Using plain colors -->\n' +
			'<div class="fpa-bg-primary">Primary</div>\n'
	};

	/**
	 * List of color names.
	 */
	public colorsWithVariables = ['light-shades', 'light-accent', 'main-band', 'dark-accent', 'dark-shades'];

	public colors = [
		'main-band-highlight',
		'main-band',
		'danger',
		'default',
		'dark-shades-highlight',
		'dark-shades',
		'info',
		'light-shades-highlight',
		'light-shades',
		'primary',
		'light-accent-highlight',
		'light-accent',
		'dark-accent-highlight',
		'dark-accent',
		'success',
		'warning'
	];
	/**
	 * List of shade levels.
	 */
	public shades = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	protected readonly Scopes = Scopes;
}
