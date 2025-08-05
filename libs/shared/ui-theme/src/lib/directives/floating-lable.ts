/*
 * Copyright (c) 2025. Frank-Peter Andrä
 * All rights reserved.
 */

import { Directive, input } from '@angular/core';

/**
 *
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
