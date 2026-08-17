/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint, PaintBrandDefinition, PaintColorGroup } from '@application-platform/paint';

/**
 * Describes the content and behavior of a button in the paint selector grid.
 */
export type PaintSelectorButton =
	| {
			readonly type: 'empty';
	  }
	| {
			readonly type: 'paint';
			readonly label: string;
			readonly color: `#${string}`;
			readonly paint: Paint;
	  }
	| {
			readonly type: 'brand';
			readonly label: string;
			readonly brand: PaintBrandDefinition;
	  }
	| {
			readonly type: 'home';
			readonly label: string;
	  }
	| {
			readonly type: 'back';
			readonly label: string;
	  }
	| {
			readonly type: 'next';
			readonly label: string;
	  }
	| {
			readonly type: 'color';
			readonly label: string;
			readonly color: `#${string}`;
			readonly value: PaintColorGroup;
	  }
	| {
			readonly type: 'category';
			readonly label: string;
			readonly value: string;
	  }
	| {
			readonly type: 'clear';
			readonly label: string;
	  };
