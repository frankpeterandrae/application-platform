/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, input } from '@angular/core';

import type { MenuItem } from '../../model/menu-item.model';
import { TopNavbarComponent } from '../navigation/top-navbar/top-navbar.component';

/**
 * HeaderComponent is a standalone component that represents the header section of the application.
 * It includes the TopNavbarComponent and uses an external HTML template and CSS stylesheet.
 */
@Component({
	selector: 'theme-header',
	imports: [TopNavbarComponent],
	templateUrl: './header.component.html'
})
export class HeaderComponent {
	/**
	 * An array of MenuItem objects that represent the items to be displayed in the menu.
	 */
	public menuItems = input.required<MenuItem[]>();
}
