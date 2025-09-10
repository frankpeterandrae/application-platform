/*
 * Copyright (c) 2024-2025. Frank-Peter Andrä
 * All rights reserved.
 */

import { MenuItem, SidebarComponent } from '@angular-apps/shared/ui-theme';
import { Component, signal } from '@angular/core';
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

	/** Sidebar menu items exposed as a signal for signal-based input binding. */
	public menuItems: MenuItem[] = [
		{ id: 'button', label: 'Button', route: 'button' },
		{ id: 'checkbox', label: 'Checkbox', route: 'checkbox' },
		{ id: 'colors', label: 'Colors', route: 'colors' },
		{ id: 'icons', label: 'Icons', route: 'icons' },
		{ id: 'typography', label: 'Typography', route: 'typography' }
	];
}
