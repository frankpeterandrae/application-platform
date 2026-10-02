/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, input } from '@angular/core';

import { ButtonConfigModel } from '../../model';
import { ButtonComponent } from '../button/button.component';

/**
 * Renders a collection of configured buttons.
 */
@Component({
	selector: 'theme-button-bar',
	imports: [ButtonComponent],
	templateUrl: './button-bar.component.html'
})
export class ButtonBarComponent {
	public buttons = input.required<ButtonConfigModel[]>();
}
