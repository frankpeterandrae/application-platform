/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint } from '@application-platform/paint';

/**
 * Describes the result of pressing a paint selector button.
 */
export type PaintSelectorAction =
	| {
			readonly type: 'none';
	  }
	| {
			readonly type: 'paint-selected';
			readonly paint: Paint;
	  }
	| {
			readonly type: 'clear';
	  }
	| {
			readonly type: 'home';
	  };
