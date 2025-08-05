/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, DialogComponent, DialogConfigModel } from '@angular-apps/shared/ui-theme';
import { ColorType } from '../models/color-type.enum';
import { Color } from '../models/color.model';
import { BaseComponent, LOGGER_SOURCE, Scopes, TranslationDirective } from '@angular-apps/shared-ui';
import { colorRackTextModules } from '../i18n/i18n';
import { provideTranslocoScope } from '@jsverse/transloco';

/**
 * Component representing the details of a color.
 */
@Component({
	selector: 'cr-color-details',
	imports: [CommonModule, DialogComponent, TranslationDirective],
	templateUrl: './color-details.component.html',
	providers: [{ provide: LOGGER_SOURCE, useValue: 'ColorDetailsComponent' }, provideTranslocoScope(Scopes.COLOR_RACK)]
})
export class ColorDetailsComponent extends BaseComponent {
	public readonly data = inject<DialogConfigModel<Color>>(DIALOG_DATA);
	public readonly colorRackTextModules = colorRackTextModules;

	/**
	 * Returns the color type as a string.
	 * @returns {string} - The color type as a string.
	 */
	public colorType(): string {
		const types = this.data.componentData?.type?.split('-');

		if (types?.every((type) => type in ColorType)) {
			return types.map((type) => ColorType[type as keyof typeof ColorType]).join('-');
		}
		return 'Unknown';
	}
}
