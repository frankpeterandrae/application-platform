/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

import type { MenuItem } from '../../../model/menu-item.model';

/**
 * SidebarComponent is a standalone component that represents the sidebar navigation.
 * It uses CommonModule, RouterLink, and FastSvgComponent.
 */
@Component({
	selector: 'theme-sidebar',
	imports: [RouterLink, FastSvgComponent],
	templateUrl: './sidebar.component.html',
	styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
	/**
	 * An array of menu items to be displayed in the sidebar.
	 */
	public menuItems = input.required<MenuItem[]>();
}
