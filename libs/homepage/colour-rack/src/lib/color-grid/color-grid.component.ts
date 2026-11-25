/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DialogService, DialogType } from '@application-platform/shared/ui-theme';
import { PaintSwatchComponent } from '@application-platform/shared-ui';

import { ColorDetailsComponent } from '../color-details/color-details.component';
import type { RackColor } from '../models/color.model';

/** Displays the current page of paints and opens paint details. */
@Component({
	selector: 'cr-color-grid',
	imports: [PaintSwatchComponent],
	templateUrl: './color-grid.component.html',
	styleUrl: './color-grid.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorGridComponent {
	private readonly dialogService = inject(DialogService);

	public readonly colors = input.required<readonly RackColor[]>();

	protected openDetails(color: RackColor): void {
		this.dialogService.open(ColorDetailsComponent, {
			componentData: color,
			settings: { title: color.name, type: DialogType.INFO }
		});
	}
}
