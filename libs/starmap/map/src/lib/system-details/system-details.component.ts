/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, input, output } from '@angular/core';
import { ButtonColorDefinition, ButtonComponent, CardComponent, IconDefinition } from '@application-platform/shared/ui-theme';
import { PLANET_TYPES, PlanetType, StarSystem } from '@application-platform/starmap-domain';

/**
 * Displays detail information for a selected star system.
 */
@Component({
	selector: 'starmap-system-details',
	imports: [CardComponent, ButtonComponent],
	templateUrl: './system-details.component.html',
	styleUrl: './system-details.component.scss'
})
export class SystemDetailsComponent {
	public readonly system = input.required<StarSystem>();
	public readonly closed = output<void>();

	protected readonly ButtonColorDefinition = ButtonColorDefinition;
	protected readonly IconDefinition = IconDefinition;

	protected planetTypeLabel(type: PlanetType): string {
		return PLANET_TYPES.find((item) => item.value === type)?.label ?? type;
	}
}
