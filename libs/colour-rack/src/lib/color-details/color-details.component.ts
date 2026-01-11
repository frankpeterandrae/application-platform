/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslationPipe } from '@application-platform/services';
import { DIALOG_DATA, DialogComponent } from '@application-platform/shared/ui-theme';
import type { DialogConfigModel } from '@application-platform/shared/ui-theme';

import { ColorType } from '../models/color-type.enum';
import type { Color } from '../models/color.model';

/**
 * Component representing the details of a color.
 */
@Component({
	selector: 'cr-color-details',
	imports: [CommonModule, DialogComponent, TranslationPipe],
	templateUrl: './color-details.component.html'
})
export class ColorDetailsComponent {
	public readonly data = inject<DialogConfigModel<Color>>(DIALOG_DATA);

	/**
	 * Returns the color type as a string.
	 * @returns {string} - The color type as a string.
	 */
	public colorType(): string {
		// Guard the split call: ensure `type` is a string before calling split
		const types = this.data.componentData?.type.split('-');

		if (types?.every((type) => type in ColorType)) {
			return types.map((type) => ColorType[type as keyof typeof ColorType]).join('-');
		}
		return 'Unknown';
	}
}
