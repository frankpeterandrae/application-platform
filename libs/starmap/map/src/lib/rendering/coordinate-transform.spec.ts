/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { GRID_SIZE, MAP_MARGIN, mapPositionToSvg } from './coordinate-transform';

describe('coordinate-transform', () => {
	it('should expose the expected grid constants', () => {
		expect(GRID_SIZE).toBe(150);
		expect(MAP_MARGIN).toBe(75);
	});

	it('should map star map coordinates to svg coordinates', () => {
		expect(mapPositionToSvg(0, 0, -10, -10)).toEqual({
			x: 1650,
			y: 1650
		});
	});

	it('should map minimum coordinates to the first grid center', () => {
		expect(mapPositionToSvg(-10, -10, -10, -10)).toEqual({
			x: GRID_SIZE,
			y: GRID_SIZE
		});
	});

	it('should handle negative and shifted map bounds', () => {
		expect(mapPositionToSvg(-7, 4, -12, -3)).toEqual({
			x: 900,
			y: 1200
		});
	});
});
