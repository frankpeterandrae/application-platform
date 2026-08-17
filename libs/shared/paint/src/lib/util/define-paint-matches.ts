/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { PaintId } from '../model/paint.model';

interface PaintReference {
	readonly id: PaintId;
}

/**
 * Defines a paint match containing at least two paint references.
 */
export type PaintMatchDefinition = readonly [PaintReference, PaintReference, ...PaintReference[]];

/**
 * Defines groups of matching paints while preserving their literal types.
 *
 * Each match must contain at least two paint references.
 *
 * @param matches The paint match definitions.
 * @returns The provided paint match definitions.
 */
export function definePaintMatches<const T extends readonly PaintMatchDefinition[]>(matches: T): T {
	return matches;
}
