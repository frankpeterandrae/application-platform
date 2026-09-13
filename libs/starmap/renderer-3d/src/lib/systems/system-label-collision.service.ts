/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';

export interface SystemLabelBounds {
	systemId: string;
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/**
 * Filters star-system labels whose screen-space bounds overlap.
 */
@Injectable({
	providedIn: 'root'
})
export class SystemLabelCollisionService {
	/**
	 * Keeps labels in the supplied priority order and removes later labels
	 * that overlap an already accepted label.
	 *
	 * @param labels Label bounds ordered by priority.
	 * @param gap Additional spacing between labels in pixels.
	 * @returns IDs of labels that can be displayed without overlapping.
	 */
	public getVisibleSystemIds(labels: readonly SystemLabelBounds[], gap = 4): ReadonlySet<string> {
		const accepted: SystemLabelBounds[] = [];
		const visibleSystemIds = new Set<string>();

		for (const label of labels) {
			if (accepted.some((acceptedLabel) => this.overlaps(label, acceptedLabel, gap))) {
				continue;
			}

			accepted.push(label);
			visibleSystemIds.add(label.systemId);
		}

		return visibleSystemIds;
	}

	private overlaps(first: SystemLabelBounds, second: SystemLabelBounds, gap: number): boolean {
		return !(
			first.right + gap <= second.left ||
			first.left >= second.right + gap ||
			first.bottom + gap <= second.top ||
			first.top >= second.bottom + gap
		);
	}
}
