/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, effect, inject, signal } from '@angular/core';
import { Paint } from '@application-platform/paint';
import { PaintSwatchComponent } from '@application-platform/shared-ui';
import { PaintService } from '@application-platform/stream-overlay-data-access';

/**
 * Displays the currently selected paint in the stream overlay.
 *
 * The component reads the current paint from PaintService and exposes it
 * to the template for rendering.
 */
@Component({
	selector: 'stream-overlay-current-paint',
	standalone: true,
	templateUrl: './current-paint.component.html',
	imports: [PaintSwatchComponent],
	styleUrl: './current-paint.component.scss'
})
export class CurrentPaintComponent {
	private readonly PAINT_TRANSITION_DURATION_MS = 500;
	private readonly paintService = inject(PaintService);

	protected currentPaint = signal<Paint | null>(null);

	constructor() {
		effect((onCleanup) => {
			const paint = this.paintService.currentPaint();

			this.currentPaint.set(null);

			if (!paint) {
				return;
			}
			const timeout = setTimeout(() => {
				this.currentPaint.set(paint);
			}, this.PAINT_TRANSITION_DURATION_MS);

			onCleanup(() => clearTimeout(timeout));
		});
	}

	protected getBrandName(brandId: string): string {
		// replace score with space and capitalize letter after space
		return brandId.replaceAll('-', ' ').replaceAll(/\b\w/g, (character) => character.toUpperCase());
	}
}
