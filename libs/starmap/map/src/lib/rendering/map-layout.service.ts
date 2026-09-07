/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { MapBounds, Position3d, StarMap, StarSystem } from '@application-platform/starmap-domain';

import { RenderedMap, SvgPoint } from './render-models';

/**
 * Service providing layout information for the map rendering.
 */
@Injectable({
	providedIn: 'root'
})
export class MapLayoutService {
	public readonly gridSize = 150;
	public readonly mapMargin = 75;

	private readonly minimumMapCoordinate = 10;
	private readonly mapCoordinateOffset = 3;

	/**
	 * Calculates the rendered map data for a given star map, including its bounds, width, and height for rendering.
	 * @param map The star map for which to calculate the rendered map data.
	 * @returns A RenderedMap object containing the bounds, width, and height for rendering the star map on the SVG canvas.
	 */
	public getRenderedMap(map: StarMap): RenderedMap {
		const bounds = this.getMapBounds(map);

		return {
			bounds,
			width: (bounds.maxX - bounds.minX + 2) * this.gridSize,
			height: (bounds.maxY - bounds.minY + 2) * this.gridSize,
			xGridLines: this.getGridLines(bounds.minX, bounds.maxX),
			yGridLines: this.getGridLines(bounds.minY, bounds.maxY)
		};
	}

	private getGridLines(min: number, max: number): number[] {
		const fieldCount = max - min + 1;

		return Array.from({ length: fieldCount + 1 }, (_, index) => index * this.gridSize + this.mapMargin);
	}

	/**
	 * Calculates the position of a star system on the SVG map based on its coordinates and the map bounds.
	 * @param system The star system for which to calculate the position.
	 * @param map The star map containing the system and its bounds.
	 * @returns An SvgPoint object containing the x and y coordinates for rendering the star system on the SVG map.
	 */
	public getSystemPosition(system: StarSystem, map: StarMap): SvgPoint {
		return this.getPosition(system.position, this.getRenderedMap(map).bounds);
	}

	private getMapBounds(map: StarMap): MapBounds {
		const positions = [...map.systems.map((system) => system.position), ...map.nebulae.flatMap((nebula) => nebula.points)];

		if (positions.length === 0) {
			return {
				minX: -this.minimumMapCoordinate,
				maxX: this.minimumMapCoordinate,
				minY: -this.minimumMapCoordinate,
				maxY: this.minimumMapCoordinate,
				minZ: -this.minimumMapCoordinate,
				maxZ: this.minimumMapCoordinate
			};
		}

		return {
			minX: Math.min(-this.minimumMapCoordinate, Math.min(...positions.map((position) => position.x)) - this.mapCoordinateOffset),

			maxX: Math.max(this.minimumMapCoordinate, Math.max(...positions.map((position) => position.x)) + this.mapCoordinateOffset),

			minY: Math.min(-this.minimumMapCoordinate, Math.min(...positions.map((position) => position.y)) - this.mapCoordinateOffset),

			maxY: Math.max(this.minimumMapCoordinate, Math.max(...positions.map((position) => position.y)) + this.mapCoordinateOffset),

			minZ: Math.min(-this.minimumMapCoordinate, Math.min(...positions.map((position) => position.z)) - this.mapCoordinateOffset),

			maxZ: Math.max(this.minimumMapCoordinate, Math.max(...positions.map((position) => position.z)) + this.mapCoordinateOffset)
		};
	}

	/**
	 * Calculates the SVG position for a given 3D position in the star map, taking into account the map bounds and grid size.
	 * @param position The 3D position in the star map to convert to SVG coordinates.
	 * @param bounds The bounds of the star map used for calculating the SVG position.
	 * @returns An SvgPoint object containing the x and y coordinates for rendering the position on the SVG map.
	 */
	public getPosition(position: Position3d, bounds: MapBounds): SvgPoint {
		return {
			x: this.getCoordinatePosition(position.x, bounds.minX),
			y: this.getCoordinatePosition(position.y, bounds.minY)
		};
	}

	/**
	 * Calculates the SVG center position of a map coordinate.
	 * @param coordinate The map coordinate.
	 * @param minimumCoordinate The minimum coordinate of the rendered axis.
	 * @returns The SVG position at the center of the corresponding grid field.
	 */
	public getCoordinatePosition(coordinate: number, minimumCoordinate: number): number {
		return (coordinate - minimumCoordinate + 1) * this.gridSize;
	}
}
