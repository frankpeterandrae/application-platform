/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { TooltipDirective } from '@application-platform/shared/ui-theme';

/**
 * Component representing a color palette with various shades.
 */
@Component({
	selector: 'demo-colors',
	imports: [NgClass, TooltipDirective],
	templateUrl: './colors.component.html',
	styleUrl: './colors.component.scss'
})
export class ColorsComponent {
	/**
	 * List of color names.
	 */
	public colorsWithVariables = ['linen', 'sandy-brown', 'crimson', 'slate-gray', 'ebony'];

	public colors = [
		'crimson-highlight',
		'crimson',
		'danger',
		'default',
		'ebony-highlight',
		'ebony',
		'info',
		'linen-highlight',
		'linen',
		'primary',
		'sandy-brown-highlight',
		'sandy-brown',
		'slate-gray-highlight',
		'slate-gray',
		'success',
		'warning'
	];
	/**
	 * List of shade levels.
	 */
	public shades = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
}
