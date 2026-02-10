/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { IconDefinition, TooltipDirective } from '@application-platform/shared/ui-theme';
import { Scopes, TranslationPipe } from '@application-platform/shared-ui';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 *
 */
@Component({
	selector: 'demo-icon',
	imports: [FastSvgComponent, TooltipDirective, DemoThemeContainerComponent, TranslationPipe],
	templateUrl: './icon-demo.component.html'
})
export class IconDemoComponent {
	protected readonly i18nTextModules = i18nTextModules;
	protected readonly IconDefinition = IconDefinition;

	public description: Description = {
		title: i18nTextModules.Icon.lbl.Title,
		description: i18nTextModules.Icon.lbl.Description,
		usage: '<fast-svg\n' + '\tclass="fpa-color-main-band"\n' + '\t[name]="IconDefinition.SEARCH"\n' + '\t[size]="\'32\'"\n' + '/>'
	};

	private readonly iconDefinition = IconDefinition;

	// enum to array conversion
	public icons = Object.keys(this.iconDefinition)
		.map((key) => this.iconDefinition[key as keyof typeof this.iconDefinition])
		.filter((value) => !!value);
	protected readonly Scopes = Scopes;
}
