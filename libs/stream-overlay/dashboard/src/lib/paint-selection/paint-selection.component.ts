/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PaintId } from '@application-platform/paint';
import { PaintSelector, PaintSelectorSlot } from '@application-platform/paint-selector';
import { PaintSwatchComponent } from '@application-platform/shared-ui';
import { PaintService } from '@application-platform/stream-overlay-data-access';
import { PaintApiService } from '@application-platform/stream-overlay-paint-api';
import { forkJoin } from 'rxjs';

import { DashboardContainerComponent } from '../dashboard-container/dashboard-container.component';

/**
 * Provides the paint selection interface for the stream overlay dashboard.
 *
 * The component loads brands, paints and recent paint selections, delegates
 * slot generation and navigation to PaintSelector and sends selected paints
 * through PaintService.
 */
@Component({
	selector: 'stream-dashboard-root',
	standalone: true,
	templateUrl: './paint-selection.component.html',
	imports: [DashboardContainerComponent, PaintSwatchComponent],
	styleUrl: './paint-selection.component.scss'
})
export class PaintSelectionComponent {
	private readonly paintApiService = inject(PaintApiService);
	private readonly paintService = inject(PaintService);
	private readonly router = inject(Router);

	private selector?: PaintSelector;

	private recentPaintIds: PaintId[] = [];

	protected readonly slots = signal<PaintSelectorSlot[]>([]);

	constructor() {
		forkJoin({
			brands: this.paintApiService.getBrands(),
			paints: this.paintApiService.getPaints(),
			recentPaintIds: this.paintApiService.getRecentPaints()
		}).subscribe(({ brands, paints, recentPaintIds }) => {
			this.recentPaintIds = recentPaintIds;
			this.selector = new PaintSelector({
				brands,
				paints: [...paints].sort((a, b) => a.sku.localeCompare(b.sku)),
				recentPaintIds: this.recentPaintIds
			});
			this.updateSlots();
		});
	}

	/**
	 * Handles a button press in the paint selector grid.
	 *
	 * @param index The pressed slot index.
	 */
	protected press(index: number): void {
		if (!this.selector) {
			return;
		}

		const action = this.selector.press(index);

		switch (action.type) {
			case 'paint-selected':
				this.paintService.selectPaint(action.paint);
				this.updateRecentPaints(action.paint.id);
				break;

			case 'home':
				void this.router.navigate(['/dashboard']);
				break;

			case 'none':
				break;
			case 'clear':
				this.paintService.clearPaint();
				break;
		}

		this.updateSlots();
	}

	private updateRecentPaints(paintId: PaintId): void {
		this.recentPaintIds = [paintId, ...this.recentPaintIds.filter((id) => id !== paintId)].slice(0, 8);

		this.selector?.updateRecentPaints(this.recentPaintIds);
	}

	private updateSlots(): void {
		this.slots.set(this.selector?.slots ?? []);
	}
}
