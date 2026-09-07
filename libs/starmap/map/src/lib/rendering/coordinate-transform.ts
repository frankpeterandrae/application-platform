/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export const GRID_SIZE = 150;
export const MAP_MARGIN = 75;

export interface SvgPoint {
	x: number;
	y: number;
}

/**
 * Maps a given position in the star map to an SVG coordinate, taking into account the minimum x and y values of the map.
 * @param x - The x-coordinate in the star map.
 * @param y - The y-coordinate in the star map.
 * @param minX - The minimum x-coordinate in the star map.
 * @param minY - The minimum y-coordinate in the star map.
 * @returns An SvgPoint object containing the mapped x and y coordinates for SVG rendering.
 */
export function mapPositionToSvg(x: number, y: number, minX: number, minY: number): SvgPoint {
	return {
		x: (x - minX + 1) * GRID_SIZE,
		y: (y - minY + 1) * GRID_SIZE
	};
}
