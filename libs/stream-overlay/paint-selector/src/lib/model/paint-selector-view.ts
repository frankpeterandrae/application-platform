/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { PaintSelectorFilter } from './paint-selector-filter';

/**
 * Describes the current navigation state of the paint selector.
 */
export type PaintSelectorView =
	| {
			readonly type: 'home';
			readonly page: number;
	  }
	| {
			readonly type: 'brand';
			readonly brand: string;
			readonly page: number;
	  }
	| {
			readonly type: 'paints';
			readonly brand: string;
			readonly filter: PaintSelectorFilter;
			readonly page: number;
	  };
