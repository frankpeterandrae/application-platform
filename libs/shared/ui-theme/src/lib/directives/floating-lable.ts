/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Directive, input } from '@angular/core';

/**
 * Adds floating-label styling to a label element when the input is active.
 */
@Directive({
	selector: 'label[themeFloatingLabel]',
	host: {
		class: 'fpa-floating-label',
		'[class.fpa-floating-label-float-above]': 'floating()'
	}
})
export class FloatingLabelDirective {
	public floating = input<boolean>(false);
}
