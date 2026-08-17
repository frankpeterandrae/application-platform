/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { PaintColorGroup } from '@application-platform/paint';

/**
 * Describes the filter used to select paints within a brand.
 */
export type PaintSelectorFilter =
	| {
			readonly type: 'color';
			readonly value: PaintColorGroup;
	  }
	| {
			readonly type: 'category';
			readonly value: string;
	  };
