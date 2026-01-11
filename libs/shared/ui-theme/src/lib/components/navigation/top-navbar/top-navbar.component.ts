/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ColorDefinition } from '../../../enums';
import type { MenuItem } from '../../../model/menu-item.model';

/**
 * Component representing the top navigation bar.
 */
@Component({
	selector: 'theme-topnavbar',
	imports: [CommonModule, RouterLink],
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
	 * Convert an iterable or HTMLCollection to an array for template iteration.
	 * The template can call this helper: `toArray(navItem.children)`.
	 */
	public toArray<T>(value: Iterable<T> | ArrayLike<T> | null | undefined): T[] {
		if (!value) return [];
		// If it already has Array.from available in global scope, this will use it;
		// otherwise, fallback to manual conversion to keep template-friendly logic here.
		try {
			return Array.from(value as Iterable<T>);
		} catch {
			return ([] as T[]).slice.call(value as ArrayLike<T>);
		}
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
