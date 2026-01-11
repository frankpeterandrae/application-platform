/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { ButtonColorDefinition, ButtonComponent } from '@application-platform/shared/ui-theme';

/**
 *
 */
@Component({
	selector: 'demo-button',
	imports: [ButtonComponent],
	templateUrl: './button-demo.component.html'
})
export class ButtonDemoComponent {
	protected readonly ButtonColorDefinition = ButtonColorDefinition;
}
