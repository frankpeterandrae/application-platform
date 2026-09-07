/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';

import { MapLayoutService } from './map-layout.service';
import { RenderedMap } from './render-models';
import { SvgElementService } from './svg-element.service';

/**
 * Service responsible for rendering coordinate labels along the X and Y axes.
 */
@Injectable({
	providedIn: 'root'
})
export class AxisRendererService {
	private readonly layout = inject(MapLayoutService);

	private readonly svg = inject(SvgElementService);

	/**
	 * Renders the X and Y coordinate labels for the given map.
	 * @param renderedMap The rendered map containing the map bounds.
	 * @returns An SVG group containing all coordinate labels.
	 */
	public render(renderedMap: RenderedMap): SVGGElement {
		const group = this.svg.create('g');

		group.setAttribute('id', 'axis-labels');

		this.renderXAxis(group, renderedMap);

		this.renderYAxis(group, renderedMap);

		return group;
	}

	private renderXAxis(group: SVGGElement, renderedMap: RenderedMap): void {
		for (let coordinate = renderedMap.bounds.minX; coordinate <= renderedMap.bounds.maxX; coordinate++) {
			const text = this.createLabel(coordinate, this.layout.getCoordinatePosition(coordinate, renderedMap.bounds.minX), 35);

			text.setAttribute('text-anchor', 'middle');

			group.append(text);
		}
	}

	private renderYAxis(group: SVGGElement, renderedMap: RenderedMap): void {
		for (let coordinate = renderedMap.bounds.minY; coordinate <= renderedMap.bounds.maxY; coordinate++) {
			const text = this.createLabel(coordinate, 35, this.layout.getCoordinatePosition(coordinate, renderedMap.bounds.minY));

			text.setAttribute('text-anchor', 'middle');

			text.setAttribute('dominant-baseline', 'middle');

			group.append(text);
		}
	}

	private createLabel(value: number, x: number, y: number): SVGTextElement {
		const text = this.svg.create('text');

		text.setAttribute('x', String(x));
		text.setAttribute('y', String(y));
		text.setAttribute('font-size', '24');
		text.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
		text.setAttribute('fill', '#b0b0b0');

		text.textContent = String(value);

		return text;
	}
}
