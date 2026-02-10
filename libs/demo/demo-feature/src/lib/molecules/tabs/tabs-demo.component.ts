/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { TabComponent, TabGroupComponent } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

export interface TabItem {
	label: string;
	content: string;
}

/**
 * TabsDemoComponent demonstrates the usage of the Tab components.
 */
@Component({
	selector: 'demo-tabs',
	imports: [TabGroupComponent, TabComponent, DemoThemeContainerComponent],
	templateUrl: './tabs-demo.component.html'
})
export class TabsDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public tabs: TabItem[] = [
		{
			label: 'Overview',
			content: 'This is the overview tab content with information about the main topic.'
		},
		{
			label: 'Details',
			content: 'Detailed information and specifications are displayed in this tab.'
		},
		{
			label: 'Documentation',
			content: 'Complete documentation and usage examples can be found here.'
		},
		{
			label: 'Examples',
			content: 'Practical examples and code samples are provided in this tab.'
		}
	];

	public description: Description = {
		title: i18nTextModules.Tabs.lbl.Title,
		description: i18nTextModules.Tabs.lbl.Description,
		usage:
			'<theme-tab-group>\n' +
			'\t<theme-tab [label]="\'Tab 1\'">\n' +
			'\t\tContent for tab 1\n' +
			'\t</theme-tab>\n' +
			'\t<theme-tab [label]="\'Tab 2\'">\n' +
			'\t\tContent for tab 2\n' +
			'\t</theme-tab>\n' +
			'</theme-tab-group>',
		language: 'html',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'theme-tab-group', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Tabs.lbl.TabsDescription,
							span: 5,
							columntype: 'string',
							type: 'TabGroupComponent'
						}
					]
				},
				{
					columns: [
						{ value: 'theme-tab', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Tabs.lbl.ThemeTabDescription,
							span: 5,
							columntype: 'string',
							type: 'TabComponent'
						}
					]
				}
			]
		}
	};
}
