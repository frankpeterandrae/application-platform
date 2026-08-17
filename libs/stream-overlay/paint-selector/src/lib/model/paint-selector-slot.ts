/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { PaintSelectorButton } from './paint-selector-button';

/**
 * Represents one position in the paint selector grid.
 */
export interface PaintSelectorSlot {
	readonly index: number;
	readonly button: PaintSelectorButton;
}
