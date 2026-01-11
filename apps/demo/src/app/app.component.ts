/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import type { MenuItem } from '@application-platform/shared/ui-theme';
import { SidebarComponent } from '@application-platform/shared/ui-theme';

/**
 * The root component of the demo application.
 */
@Component({
	imports: [SidebarComponent, RouterOutlet],
	selector: 'demo-root',
	templateUrl: './app.component.html'
})
export class AppComponent {
	/** The title of the application. */
	public title = 'demo';

	/** The color definitions used in the application. */
	public menuItems: MenuItem[];

	/**
	 * Constructor for the AppComponent.
	 * Initializes the menu items with their respective labels and routes.
	 */
	constructor() {
		this.menuItems = [
			{ label: 'Button', route: 'button' },
			{ label: 'Colors', route: 'colors' },
			{ label: 'Icons', route: 'icons' },
			{ label: 'Typography', route: 'typography' }
		];
	}
}
