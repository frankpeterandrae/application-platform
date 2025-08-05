/*
 * Copyright (c) 2024-2025. Frank-Peter Andrä
 * All rights reserved.
 */

import { MenuItem, SidebarComponent } from '@angular-apps/shared/ui-theme';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
			{ id: 'button', label: 'Button', route: 'button' },
			{ id: 'checkbox', label: 'Checkbox', route: 'checkbox' },
			{ id: 'colors', label: 'Colors', route: 'colors' },
			{ id: 'icons', label: 'Icons', route: 'icons' },
			{ id: 'typography', label: 'Typography', route: 'typography' }
		];
	}
}
