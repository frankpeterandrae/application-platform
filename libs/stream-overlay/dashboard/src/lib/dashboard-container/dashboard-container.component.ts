/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { MenuItem, SidebarComponent } from '@application-platform/shared/ui-theme';

/**
 * Provides the shared dashboard layout and sidebar navigation.
 */
@Component({
	selector: 'stream-dashboard-container',
	imports: [SidebarComponent],
	templateUrl: './dashboard-container.component.html'
})
export class DashboardContainerComponent {
	/**
	 * Returns the menu items displayed in the dashboard sidebar.
	 *
	 * @returns The dashboard navigation items.
	 */
	public get menuItems(): MenuItem[] {
		return [
			{
				id: 'button',
				label: 'Farbauswahl',
				route: '../paints'
			},
			{
				id: 'paint-editor',
				label: 'Farbeditor',
				route: '../paint-editor'
			},
			{
				id: 'stream-info',
				label: 'Stream Info',
				route: '../stream-info'
			}
		];
	}
}
