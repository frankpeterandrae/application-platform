/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint, PaintBrandDefinition, PaintId } from '@application-platform/paint';

/**
 * Configuration used to initialize a PaintSelector instance.
 */
export interface PaintSelectorConfig {
	readonly paints: readonly Paint[];
	readonly brands: readonly PaintBrandDefinition[];
	readonly recentPaintIds?: readonly PaintId[];
}
