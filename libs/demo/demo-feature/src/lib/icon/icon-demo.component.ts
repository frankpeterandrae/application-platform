/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { TooltipDirective } from '@application-platform/shared/ui-theme';
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
	public icons = ['check', 'close', 'home', 'menu', 'paintbrush', 'search'];
}
