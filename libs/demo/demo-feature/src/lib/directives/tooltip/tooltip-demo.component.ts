/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { TooltipDirective } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * TooltipDemoComponent demonstrates the usage of the Tooltip directive.
 */
@Component({
	selector: 'demo-tooltip',
	imports: [TooltipDirective, DemoThemeContainerComponent],
	templateUrl: './tooltip-demo.component.html'
})
export class TooltipDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public description: Description = {
		title: i18nTextModules.Tooltip.lbl.Title,
		description: i18nTextModules.Tooltip.lbl.Description,
		usage: '<button\n' + '\t[themeTooltip]="\'This is a helpful tooltip\'"\n' + '>\n' + '\tHover me\n' + '</button>',
		language: 'html',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'themeTooltip', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Tooltip.lbl.TooltipTextDescription,
							span: 5,
							columntype: 'string',
							type: 'string'
						}
					]
				}
			]
		}
	};
}
