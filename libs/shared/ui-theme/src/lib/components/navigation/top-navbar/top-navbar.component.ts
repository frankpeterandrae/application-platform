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

	/**
	 * Gets children menu items as an array.
	 * @param {MenuItem | undefined} item - The menu item.
	 * @returns {MenuItem[]} - Array of child menu items.
	 */
	public getChildren(item: MenuItem | undefined): MenuItem[] {
		return item?.children ?? [];
	}

	/**
	 * Handles document mousedown events to reset dropdown menus.
	 *
	 * @param {MouseEvent} e - The mouse event.
	 */
	@HostListener('document:mousedown', ['$event'])
	public onDocMouseDown(e: MouseEvent): void {
		this.resetDropdowns();
	}
}
