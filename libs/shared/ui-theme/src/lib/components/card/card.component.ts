/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

/**
 * Displays projected content inside a themed card.
 */
@Component({
	selector: 'theme-card',
	imports: [CommonModule],
	templateUrl: './card.component.html',
	styleUrl: './card.component.scss'
})
export class CardComponent {
	/** Whether the card uses the inverted color scheme. */
	public inverted = input(false);
}
