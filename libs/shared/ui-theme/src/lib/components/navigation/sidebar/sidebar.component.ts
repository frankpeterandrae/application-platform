/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

import type { MenuItem } from '../../../model';
import { UnwrapSignalPipe } from '../../../pipes/unwrap-signal/unwrap-signal.pipe';
import { InputComponent } from '../../input/input.component';

/**
 * Renders a sidebar navigation with optional filtering.
 */
@Component({
	selector: 'theme-sidebar',
	imports: [RouterLink, FastSvgComponent, UnwrapSignalPipe, InputComponent],
	templateUrl: './sidebar.component.html',
	styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
	/**
	 * An array of menu items to be displayed in the sidebar.
	 */
	public menuItems = input.required<MenuItem[]>();
	public searchable = input(false);

	public menuItemSelected = output<MenuItem>();

	protected readonly searchTerm = signal('');

	protected readonly filteredMenuItems = computed(() => {
		const searchTerm = this.searchTerm().trim().toLowerCase();

		if (!searchTerm) {
			return this.menuItems();
		}

		return this.menuItems().filter((item) => {
			const label = item.label;

			return typeof label === 'string' && label.toLowerCase().includes(searchTerm);
		});
	});

	protected updateSearchTerm(event: string): void {
		this.searchTerm.set(event);
	}
}
