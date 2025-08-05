/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from '../../../model';
import { Router, RouterLink } from '@angular/router';
import { ColorDefinition } from '../../../enums';
import { UnwrapSignalPipe } from '../../../pipes/unwrap-signal/unwrap-signal.pipe';

/**
 * Component representing the top navigation bar.
 */
@Component({
	selector: 'theme-topnavbar',
	imports: [CommonModule, RouterLink, UnwrapSignalPipe],
	templateUrl: './top-navbar.component.html',
	styleUrl: './top-navbar.component.scss'
})
export class TopNavbarComponent {
	public readonly router = inject(Router);

	/**
	 * Array of menu items to be displayed in the navigation bar.
	 */
	public menuItems = input.required<MenuItem[]>();

	/**
	 * Enum for color definitions.
	 */
	protected readonly ColorDefinition = ColorDefinition;

	/**
	 * Object to track the state of dropdown menus.
	 */
	public showDropdown: { [key: string]: boolean } = {};

	/**
	 * Gets the current route URL.
	 * @returns {string} - The current route URL as a string.
	 */
	public getCurrentRoute(): string {
		return this.router.url;
	}

	/**
	 * Toggles the visibility of a dropdown menu.
	 * @param {string} route - The route associated with the dropdown menu.
	 */
	public toggleNavigation(route: string): void {
		this.showDropdown[route] = !this.showDropdown[route];
	}

	/**
	 * Resets all dropdown menus to be hidden.
	 */
	public resetDropdowns(): void {
		this.showDropdown = {};
	}
}
