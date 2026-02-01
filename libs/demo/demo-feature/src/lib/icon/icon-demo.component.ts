/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { IconDefinition, TooltipDirective } from '@application-platform/shared/ui-theme';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

/**
 *
 */
@Component({
	selector: 'demo-icon',
	imports: [FastSvgComponent, TooltipDirective],
	templateUrl: './icon-demo.component.html'
})
export class IconDemoComponent {
	private readonly iconDefinition = IconDefinition;

	// enum to array conversion
	public icons = Object.keys(this.iconDefinition)
		.map((key) => this.iconDefinition[key as keyof typeof this.iconDefinition])
		.filter((value) => !!value);
}
