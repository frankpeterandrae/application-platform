/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, input } from '@angular/core';
import { CardComponent } from '@application-platform/shared/ui-theme';
import { StarSystem } from '@application-platform/starmap-domain';

/**
 * Displays detail information for a selected star system.
 */
@Component({
	selector: 'starmap-system-details',
	imports: [CardComponent],
	templateUrl: './system-details.component.html',
	styleUrl: './system-details.component.scss'
})
export class SystemDetailsComponent {
	public readonly system = input.required<StarSystem>();
}
