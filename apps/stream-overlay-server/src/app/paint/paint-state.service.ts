/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint } from '@application-platform/paint';
import { Injectable } from '@nestjs/common';

/**
 * Stores the currently selected paint in application memory.
 */
@Injectable()
export class PaintStateService {
	private currentPaint: Paint | undefined;

	/**
	 * Returns the currently selected paint.
	 *
	 * @returns The current paint or undefined when no paint has been selected.
	 */
	public getCurrentPaint(): Paint | undefined {
		return this.currentPaint;
	}

	/**
	 * Updates the currently selected paint.
	 *
	 * @param paint The paint to store as the current selection.
	 */
	public setCurrentPaint(paint: Paint): void {
		this.currentPaint = paint;
	}

	/**
	 * Clears the currently selected paint.
	 */
	public clearCurrentPaint(): void {
		this.currentPaint = undefined;
	}
}
