/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { PaintId } from './paint.model';

/**
 * Defines a group of paints that are considered equivalent matches.
 */
export interface PaintMatch {
	readonly paints: readonly [PaintId, PaintId, ...PaintId[]];
}
