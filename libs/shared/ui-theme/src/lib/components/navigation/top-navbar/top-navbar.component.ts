/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ColorDefinition } from '../../../enums';
import type { MenuItem } from '../../../model';
import { UnwrapSignalPipe } from '../../../pipes/unwrap-signal/unwrap-signal.pipe';

/**
 * Renders the primary navigation bar with nested dropdown menus.
 */
@Component({
	selector: 'theme-topnavbar',
	imports: [CommonModule, RouterLink, UnwrapSignalPipe],
	templateUrl: './top-navbar.component.html',
	styleUrl: './top-navbar.component.scss'
})
export class TopNavbarComponent {
	protected readonly router = inject(Router);

	/**
	 * Array of menu items to be displayed in the navigation bar.
	 */
	public menuItems = input.required<MenuItem[]>();

	protected readonly ColorDefinition = ColorDefinition;

	protected showDropdown: { [key: string]: boolean } = {};

	protected toggleNavigation(route: string): void {
		this.showDropdown[route] = !this.showDropdown[route];
	}

	protected resetDropdowns(): void {
		this.showDropdown = {};
	}

	@HostListener('document:mousedown')
	protected onDocMouseDown(): void {
		this.resetDropdowns();
	}
}
