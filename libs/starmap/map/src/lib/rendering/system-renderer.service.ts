/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable, inject } from '@angular/core';
import { StarMap, StarSystem } from '@application-platform/starmap-domain';

import { MapLayoutService } from './map-layout.service';
import { RenderedSystem, StarOffset } from './render-models';
import { StarRendererService } from './star-renderer.service';
import { SvgElementService } from './svg-element.service';

interface TweakOffsetRule {
	matches: (starCount: number, largeStarCount: number) => boolean;
	getOffset: (temp: StarOffset) => StarOffset;
}

/**
 * Service responsible for calculating and rendering star systems and their labels on the SVG map.
 */
@Injectable({
	providedIn: 'root'
})
export class SystemRendererService {
	private readonly mapLayoutService = inject(MapLayoutService);
	private readonly starRendererService = inject(StarRendererService);
	private readonly svgElementService = inject(SvgElementService);

	private readonly duplicateSystemOffsets: StarOffset[] = [
		{ x: 0, y: 0 },
		{ x: -30, y: 30 },
		{ x: 30, y: -30 },
		{ x: -30, y: -30 },
		{ x: 30, y: 30 }
	];

	private readonly tweakOffsetRules: readonly TweakOffsetRule[] = [
		{
			matches: (starCount, largeStarCount) => largeStarCount === 1 && starCount < 5,
			getOffset: (temp) => ({
				x: -temp.x,
				y: -temp.y
			})
		},
		{
			matches: (starCount, largeStarCount) => largeStarCount === 2 && [3, 4].includes(starCount),
			getOffset: (temp) => ({
				x: 0,
				y: -temp.y
			})
		},
		{
			matches: (starCount, largeStarCount) => largeStarCount === 3 && [4, 5].includes(starCount),
			getOffset: (temp) => ({
				x: 0,
				y: -temp.y
			})
		},
		{
			matches: (starCount, largeStarCount) => starCount === 4 && largeStarCount < 3,
			getOffset: (temp) => ({
				x: -0.5 * temp.x,
				y: -0.5 * temp.y
			})
		},
		{
			matches: (starCount, largeStarCount) => starCount > 5 && largeStarCount === 1,
			getOffset: (temp) => ({
				x: -0.5 * temp.x,
				y: -0.5 * temp.y
			})
		},
		{
			matches: (starCount, largeStarCount) => starCount > 7 && [2, 4, 5].includes(largeStarCount),
			getOffset: (temp) => ({
				x: -0.5 * temp.x,
				y: -0.5 * temp.y
			})
		},
		{
			matches: (starCount, largeStarCount) => [6, 7].includes(starCount) && largeStarCount === 2,
			getOffset: (temp) => ({
				x: 0,
				y: -0.5 * temp.y
			})
		},
		{
			matches: (starCount, largeStarCount) => [6, 7].includes(starCount) && largeStarCount === 3,
			getOffset: (temp) => ({
				x: temp.x,
				y: -0.5 * temp.y
			})
		},
		{
			matches: (starCount, largeStarCount) => [6, 7].includes(starCount) && [4, 5].includes(largeStarCount),
			getOffset: (temp) => ({
				x: temp.x,
				y: 0
			})
		},
		{
			matches: (starCount, largeStarCount) => starCount > 7 && largeStarCount === 3,
			getOffset: (temp) => ({
				x: temp.x,
				y: -0.5 * temp.y
			})
		},
		{
			matches: (starCount, largeStarCount) => starCount > 7 && [6, 7].includes(largeStarCount),
			getOffset: (temp) => ({
				x: -0.5 * temp.x,
				y: 0
			})
		}
	];

	/**
	 * Calculates the rendered system data, including position, star offset, and label position, for a given star system based on its coordinates and the map bounds.
	 * @param system The star system for which to calculate the rendered data.
	 * @param map The star map containing the system and its bounds.
	 * @returns A RenderedSystem object containing the position, star offset, and label position for rendering the star system on the SVG map.
	 */
	public getRenderedSystem(system: StarSystem, map: StarMap): RenderedSystem {
		const position = this.mapLayoutService.getSystemPosition(system, map);

		const duplicateOffset = this.getDuplicateSystemOffset(system, map.systems);

		const starOffset = this.getSystemTweakOffset(system);

		const drawnPosition = {
			x: position.x + duplicateOffset.x,
			y: position.y + duplicateOffset.y
		};

		return {
			position: drawnPosition,

			starOffset,

			labelPosition: {
				x: drawnPosition.x + 25,
				y: drawnPosition.y - 25
			},

			zPosition: {
				x: 20,
				y: 30
			}
		};
	}

	/**
	 * Renders the star systems of the given star map as an SVG group element.
	 * @param map The star map containing the systems to render.
	 * @returns An SVGGElement containing the rendered star systems.
	 */
	public renderSystems(map: StarMap): SVGGElement {
		const systemsGroup = this.svgElementService.create('g');

		systemsGroup.setAttribute('id', 'systems');

		for (const system of map.systems) {
			const renderedSystem = this.getRenderedSystem(system, map);

			const systemGroup = this.svgElementService.create('g');

			systemGroup.setAttribute('class', 'star-system');
			systemGroup.dataset['systemId'] = system.id;
			systemGroup.setAttribute('tabindex', '0');
			systemGroup.setAttribute('role', 'button');
			systemGroup.setAttribute('aria-label', system.name);

			systemGroup.setAttribute(
				'transform',
				`translate(${renderedSystem.position.x + renderedSystem.starOffset.x},${
					renderedSystem.position.y + renderedSystem.starOffset.y
				})`
			);

			systemGroup.append(this.starRendererService.renderStars(system));

			const zLabel = this.svgElementService.create('text');

			zLabel.setAttribute('x', String(renderedSystem.zPosition.x));

			zLabel.setAttribute('y', String(renderedSystem.zPosition.y));

			zLabel.setAttribute('font-size', '30');

			zLabel.setAttribute('font-family', 'Arial, Helvetica, sans-serif');

			zLabel.setAttribute('fill', 'white');

			zLabel.textContent = `${system.position.z > 0 ? '+' : ''}${system.position.z}`;

			systemGroup.append(zLabel);

			systemsGroup.append(systemGroup);
		}

		return systemsGroup;
	}

	/**
	 * Renders the names of the star systems in the given star map as an SVG group element.
	 * @param map The star map containing the systems whose names are to be rendered.
	 * @returns An SVGGElement containing the rendered names of the star systems.
	 */
	public renderNames(map: StarMap): SVGGElement {
		const group = this.svgElementService.create('g');

		group.setAttribute('id', 'names');

		for (const system of map.systems) {
			const renderedSystem = this.getRenderedSystem(system, map);

			const label = this.svgElementService.create('text');

			label.setAttribute('x', String(renderedSystem.labelPosition.x));

			label.setAttribute('y', String(renderedSystem.labelPosition.y));

			label.setAttribute('font-size', '50');

			label.setAttribute('font-family', 'Arial, Helvetica, sans-serif');

			label.setAttribute('fill', 'white');

			label.textContent = system.name;

			group.append(label);
		}

		return group;
	}

	private getDuplicateSystemOffset(system: StarSystem, systems: StarSystem[]): StarOffset {
		const systemsAtSamePosition = systems.filter(
			(candidate) => candidate.position.x === system.position.x && candidate.position.y === system.position.y
		);

		if (systemsAtSamePosition.length <= 1) {
			return { x: 0, y: 0 };
		}

		const duplicateIndex = systemsAtSamePosition.findIndex((candidate) => candidate.id === system.id);

		return this.duplicateSystemOffsets[duplicateIndex] ?? { x: 0, y: 0 };
	}

	private getSystemTweakOffset(system: StarSystem): StarOffset {
		const starCount = system.stars.length;

		if (starCount <= 1) {
			return {
				x: 0,
				y: 0
			};
		}

		const largeStarCount = system.stars.filter((star) => this.starRendererService.spectralTypeToValue(star.spectralType) < 560).length;

		const firstOffset = this.starRendererService.getStarOffsets(starCount)[0];

		const temp: StarOffset = {
			x: firstOffset.x * 0.5,
			y: firstOffset.y * 0.5
		};

		let offset: StarOffset = {
			x: 0,
			y: 0
		};

		for (const rule of this.tweakOffsetRules) {
			if (rule.matches(starCount, largeStarCount)) {
				offset = rule.getOffset(temp);
			}
		}

		return offset;
	}
}
