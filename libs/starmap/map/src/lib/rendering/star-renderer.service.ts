/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { inject, Injectable } from '@angular/core';
import { StarMap, StarSystem } from '@application-platform/starmap-domain';

import { RenderedStar, StarGradientDefinition, StarOffset, StarRenderData } from './render-models';
import { SvgElementService } from './svg-element.service';

interface StarBaseData {
	size: number;
	colors: [string, string, string];
}

type StarRenderKey =
	| 'O'
	| 'B'
	| 'A'
	| 'F'
	| 'G'
	| 'K'
	| 'M'
	| 'M_END'
	| 'F_III'
	| 'G_III'
	| 'K_III'
	| 'M_III'
	| 'F_I'
	| 'G_I'
	| 'K_I'
	| 'M_I'
	| 'BD'
	| 'WD'
	| 'NS'
	| 'BH';

/**
 * Service responsible for rendering stars in a star map, including calculating gradient definitions and rendering data for individual stars based on their spectral types.
 */
@Injectable({
	providedIn: 'root'
})
export class StarRendererService {
	private readonly svg = inject(SvgElementService);

	private readonly starData = new Map<StarRenderKey, StarBaseData>([
		['O', { size: 0.75, colors: ['#5579ff', '#1345ff', '#9cb2ff'] }],
		['B', { size: 0.75, colors: ['#5579ff', '#1345ff', '#9cb2ff'] }],
		['A', { size: 0.5, colors: ['#688bff', '#2256ff', '#b9c9ff'] }],

		['F_III', { size: 0.75, colors: ['#9cb2ff', '#607aff', '#e0e4ff'] }],
		['G_III', { size: 0.75, colors: ['#fffcb6', '#fffa72', '#fff8fc'] }],
		['K_III', { size: 0.75, colors: ['#ffc58d', '#ff9228', '#ffeedd'] }],
		['M_III', { size: 0.75, colors: ['#ff6040', '#ff4000', '#ff8030'] }],

		['F_I', { size: 1, colors: ['#9cb2ff', '#607aff', '#e0e4ff'] }],
		['G_I', { size: 1, colors: ['#fffcb6', '#fffa72', '#fff8fc'] }],
		['K_I', { size: 1, colors: ['#ffc58d', '#ff9228', '#ffeedd'] }],
		['M_I', { size: 1, colors: ['#ff6040', '#ff4000', '#ff8030'] }],

		['F', { size: 0.5, colors: ['#9cb2ff', '#607aff', '#e0e4ff'] }],
		['G', { size: 0.5, colors: ['#fffcb6', '#fffa72', '#fff8fc'] }],
		['K', { size: 0.5, colors: ['#ffc185', '#ffc185', '#ffeedd'] }],
		['M', { size: 0.25, colors: ['#ff9f41', '#ff7e00', '#ffc38b'] }],
		['M_END', { size: 0.2, colors: ['#ff6040', '#ff4000', '#ff8030'] }],

		['BD', { size: 0.2, colors: ['#ff26b0', '#ff4000', '#ff64c8'] }],
		['WD', { size: 0.25, colors: ['#5579ff', '#1345ff', '#9cb2ff'] }],
		['NS', { size: 0.375, colors: ['#c86400', '#804000', '#ff8000'] }],
		['BH', { size: 0.375, colors: ['#0000ff', '#ff0000', '#000000'] }]
	]);

	/**
	 * Renders the gradient definitions for all unique spectral types present in the given star map as an SVG <defs> element. This method generates gradient definitions for each spectral type, which can be used to render stars with appropriate colors and sizes based on their spectral classification.
	 * @param map The star map containing the star systems and their spectral types for which to generate gradient definitions.
	 * @returns An SVGDefsElement containing the gradient definitions for all unique spectral types in the star map.
	 */
	public renderDefinitions(map: StarMap): SVGDefsElement {
		const defs = this.svg.create('defs');

		for (const definition of this.getGradientDefinitions(map)) {
			defs.append(this.createGradientA(definition), this.createGradientB(definition), this.createGradientC(definition));
		}

		return defs;
	}

	private createGradientA(definition: StarGradientDefinition): SVGRadialGradientElement {
		const gradient = this.svg.create('radialGradient');

		gradient.setAttribute('id', definition.gradientA);
		gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
		gradient.setAttribute('cx', '0');
		gradient.setAttribute('cy', '0');
		gradient.setAttribute('r', String(100 * definition.size));

		const start = this.svg.create('stop');

		start.setAttribute('offset', '0');
		start.setAttribute('stop-color', definition.colors[0]);

		const end = this.svg.create('stop');

		end.setAttribute('offset', '1');
		end.setAttribute('stop-color', definition.colors[0]);
		end.setAttribute('stop-opacity', '0');

		gradient.append(start, end);

		return gradient;
	}

	private createGradientB(definition: StarGradientDefinition): SVGRadialGradientElement {
		const gradient = this.svg.create('radialGradient');

		gradient.setAttribute('id', definition.gradientB);
		gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
		gradient.setAttribute('cx', '0');
		gradient.setAttribute('cy', '0');
		gradient.setAttribute('r', String(56.25 * definition.size));

		for (const [offset, opacity] of [
			['0', '1'],
			['0.54545', '1'],
			['1', '0']
		] as const) {
			const stop = this.svg.create('stop');

			stop.setAttribute('offset', offset);
			stop.setAttribute('stop-color', definition.colors[1]);
			stop.setAttribute('stop-opacity', opacity);

			gradient.append(stop);
		}

		return gradient;
	}

	private createGradientC(definition: StarGradientDefinition): SVGRadialGradientElement {
		const gradient = this.svg.create('radialGradient');

		gradient.setAttribute('id', definition.gradientC);
		gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
		gradient.setAttribute('cx', '0');
		gradient.setAttribute('cy', '0');
		gradient.setAttribute('r', String(50 * definition.size));

		for (const [offset, opacity] of [
			['0', '1'],
			['0.5', '0.86432'],
			['1', '0']
		] as const) {
			const stop = this.svg.create('stop');

			stop.setAttribute('offset', offset);
			stop.setAttribute('stop-color', definition.colors[2]);
			stop.setAttribute('stop-opacity', opacity);

			gradient.append(stop);
		}

		return gradient;
	}

	private getGradientDefinitions(map: StarMap): StarGradientDefinition[] {
		const spectralTypes = new Set<string>();

		for (const system of map.systems) {
			for (const star of system.stars) {
				spectralTypes.add(star.spectralType);
			}
		}

		return [...spectralTypes].map((spectralType) => {
			const renderData = this.getStarRenderData(spectralType);

			const id = this.getSpectralTypeId(spectralType);

			return {
				spectralType,
				size: renderData.size,
				colors: renderData.colors,
				gradientA: `rg${id}a`,
				gradientB: `rg${id}b`,
				gradientC: `rg${id}c`
			};
		});
	}

	/**
	 * Renders the stars in a given star system as an SVG <g> element, positioning each star based on its calculated offset and applying the appropriate gradient fills based on their spectral types. This method generates the visual representation of the stars in the system, allowing for accurate rendering of multi-star systems with varying spectral classifications.
	 * @param system The star system containing the stars to render.
	 * @returns An SVGGElement containing the rendered stars for the given star system.
	 */
	public renderStars(system: StarSystem): SVGGElement {
		const group = this.svg.create('g');

		for (const star of this.getRenderedStars(system)) {
			const starGroup = this.svg.create('g');

			starGroup.setAttribute(
				'transform',
				`translate(${star.offset.x * star.renderData.size},${star.offset.y * star.renderData.size})`
			);

			starGroup.append(
				this.createCircle(55 * star.renderData.size, 'black'),
				this.createCircle(100 * star.renderData.size, `url(#${star.gradientA})`),
				this.createCircle(75 * star.renderData.size, `url(#${star.gradientB})`),
				this.createCircle(50 * star.renderData.size, `url(#${star.gradientC})`)
			);

			group.append(starGroup);
		}

		return group;
	}
	private createCircle(radius: number, fill: string): SVGCircleElement {
		const circle = this.svg.create('circle');

		circle.setAttribute('r', String(radius));
		circle.setAttribute('fill', fill);

		return circle;
	}

	private getRenderedStars(system: StarSystem): RenderedStar[] {
		const stars = [...system.stars].sort(
			(first, second) => this.spectralTypeToValue(first.spectralType) - this.spectralTypeToValue(second.spectralType)
		);

		const offsets = this.getStarOffsets(stars.length);

		return stars.map((star, index) => {
			const id = this.getSpectralTypeId(star.spectralType);

			return {
				index,
				spectralType: star.spectralType,
				renderData: this.getStarRenderData(star.spectralType),
				offset: offsets[index],
				gradientA: `rg${id}a`,
				gradientB: `rg${id}b`,
				gradientC: `rg${id}c`
			};
		});
	}
	private getSpectralTypeId(spectralType: string): string {
		return spectralType.replace(/[^a-zA-Z0-9]/g, '');
	}

	private getStarRenderKey(spectralType: string): StarRenderKey {
		if (spectralType === 'BD' || spectralType === 'WD' || spectralType === 'NS' || spectralType === 'BH') {
			return spectralType;
		}

		const spectralClass = spectralType[0] as 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';

		if (spectralType.endsWith('III')) {
			return `${spectralClass}_III` as StarRenderKey;
		}

		if (spectralType.endsWith('I')) {
			return `${spectralClass}_I` as StarRenderKey;
		}

		return spectralClass;
	}

	/**
	 * Calculates the offsets for rendering stars in a star system based on the number of stars present, ensuring that they are positioned appropriately to avoid overlap.
	 * @param starCount The number of stars in the system for which to calculate offsets.
	 * @returns An array of StarOffset objects, each containing the x and y offsets for a star in the system.
	 */
	public getStarOffsets(starCount: number): StarOffset[] {
		switch (starCount) {
			case 1:
				return [{ x: 0, y: 0 }];

			case 2:
				return [
					{ x: -24, y: -24 },
					{ x: 24, y: 24 }
				];

			case 3:
				return [
					{ x: -36, y: -36 },
					{ x: 36, y: -20 },
					{ x: -12, y: 36 }
				];

			case 4:
				return [
					{ x: -36, y: -36 },
					{ x: 36, y: -36 },
					{ x: -36, y: 36 },
					{ x: 36, y: 36 }
				];

			case 5:
				return [
					{ x: -44, y: -20 },
					{ x: 0, y: -48 },
					{ x: 44, y: -20 },
					{ x: 28, y: 32 },
					{ x: -28, y: 32 }
				];

			case 6:
				return [
					{ x: -28, y: -48 },
					{ x: 28, y: -48 },
					{ x: 56, y: 0 },
					{ x: 28, y: 48 },
					{ x: -28, y: 48 },
					{ x: -56, y: 0 }
				];

			case 7:
				return [...this.getStarOffsets(6), { x: 0, y: 0 }];

			case 8:
				return [
					{ x: -42, y: -42 },
					{ x: 0, y: -60 },
					{ x: 42, y: -42 },
					{ x: 60, y: 0 },
					{ x: 42, y: 42 },
					{ x: 0, y: 60 },
					{ x: -42, y: 42 },
					{ x: -60, y: 0 }
				];

			case 9:
				return [...this.getStarOffsets(8), { x: 0, y: 0 }];

			case 10:
				return [...this.getStarOffsets(8), { x: 20, y: -20 }, { x: -20, y: 20 }];

			default:
				return Array.from({ length: starCount }, () => ({ x: 0, y: 0 }));
		}
	}

	/**
	 * Converts a spectral type string into a numerical value for sorting purposes. The value is calculated based on the spectral class, subtype, and luminosity class of the star.
	 * @param spectralType The spectral type string to convert.
	 * @returns A numerical value representing the spectral type, which can be used for sorting stars in a star system.
	 */
	public spectralTypeToValue(spectralType: string): number {
		switch (spectralType) {
			case 'BD':
				return 580;
			case 'WD':
				return 600;
			case 'NS':
				return 700;
			case 'BH':
				return 800;
		}

		const spectralOrder = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

		const spectralClass = spectralOrder.indexOf(spectralType.substring(0, 1));

		const subtype = Number.parseInt(spectralType.substring(1, 2), 10);

		let value = spectralClass * 10 + subtype;

		switch (spectralType.substring(2)) {
			case 'I':
				value += 100;
				break;

			case 'III':
				value += 300;
				break;

			default:
				value += 500;
		}

		return value;
	}

	private getStarRenderData(spectralType: string): StarRenderData {
		const key = this.getStarRenderKey(spectralType);
		return {
			size: this.starData.get(key)?.size ?? 0.25,
			colors: this.getStarColors(spectralType)
		};
	}

	private getStarColors(spectralType: string): [string, string, string] {
		const key = this.getStarRenderKey(spectralType);
		const current = this.starData.get(key);

		if (!current) {
			return ['#ffffff', '#ffffff', '#ffffff'];
		}

		if (spectralType === 'BD' || spectralType === 'WD' || spectralType === 'NS' || spectralType === 'BH') {
			return current.colors;
		}

		const subtype = Number.parseInt(spectralType.substring(1, 2), 10);

		if (subtype === 0) {
			return current.colors;
		}

		const nextKey = this.getNextStarRenderKey(key);

		if (!nextKey) {
			return current.colors;
		}

		const next = this.starData.get(nextKey);

		if (!next) {
			return current.colors;
		}

		return [
			this.interpolateColor(current.colors[0], next.colors[0], subtype),
			this.interpolateColor(current.colors[1], next.colors[1], subtype),
			this.interpolateColor(current.colors[2], next.colors[2], subtype)
		];
	}

	private getNextStarRenderKey(key: StarRenderKey): StarRenderKey | null {
		switch (key) {
			case 'O':
				return 'B';

			case 'B':
				return 'A';

			case 'A':
				return 'F';

			case 'F':
				return 'G';

			case 'G':
				return 'K';

			case 'K':
				return 'M';

			case 'M':
				return 'M_END';

			default:
				return null;
		}
	}

	private interpolateColor(first: string, second: string, subtype: number): string {
		const firstRgb = this.hexToRgb(first);
		const secondRgb = this.hexToRgb(second);

		const red = firstRgb.red + Math.floor((secondRgb.red - firstRgb.red) / 10) * subtype;

		const green = firstRgb.green + Math.floor((secondRgb.green - firstRgb.green) / 10) * subtype;

		const blue = firstRgb.blue + Math.floor((secondRgb.blue - firstRgb.blue) / 10) * subtype;

		return `#${this.toHex(red)}${this.toHex(green)}${this.toHex(blue)}`;
	}

	private hexToRgb(hex: string): {
		red: number;
		green: number;
		blue: number;
	} {
		return {
			red: Number.parseInt(hex.slice(1, 3), 16),
			green: Number.parseInt(hex.slice(3, 5), 16),
			blue: Number.parseInt(hex.slice(5, 7), 16)
		};
	}

	private toHex(value: number): string {
		return value.toString(16).padStart(2, '0');
	}
}
