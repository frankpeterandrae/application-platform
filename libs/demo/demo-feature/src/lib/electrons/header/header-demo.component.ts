/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { HeaderComponent, MenuItem } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * HeaderDemoComponent demonstrates the usage of the Header component.
 */
@Component({
	selector: 'demo-header',
	imports: [HeaderComponent, DemoThemeContainerComponent],
	templateUrl: './header-demo.component.html'
})
export class HeaderDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public readonly menuItems: MenuItem[] = [
		{ id: 'home', label: 'Home', route: '.' },
		{
			id: 'about',
			label: 'About',
			route: '.',
			children: [{ id: 'services', label: 'Services', route: '.' }]
		}
	];

	public description: Description = {
		title: i18nTextModules.Header.lbl.Title,
		description: i18nTextModules.Header.lbl.Description,
		usage: '<theme-header [menuItems]="menuItems"></theme-header>',
		language: 'html',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'menuItems', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Header.lbl.MenuItemsDescription,
							span: 5,
							columntype: 'string',
							type: 'MenuItem[]',
							optional: true
						}
					]
				}
			]
		}
	};
}
