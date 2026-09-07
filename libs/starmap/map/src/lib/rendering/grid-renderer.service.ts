/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';

import { MapLayoutService } from './map-layout.service';
import { RenderedMap } from './render-models';
import { SvgElementService } from './svg-element.service';

/**
 * Service responsible for rendering grid lines for a rendered map as an SVG group element.
 */
@Injectable({
	providedIn: 'root'
})
export class GridRendererService {
	private readonly layout = inject(MapLayoutService);

	private readonly svg = inject(SvgElementService);

	/**
	 * Renders the grid lines for the given rendered map as an SVG group element.
	 * @param renderedMap The rendered map data containing grid line positions and dimensions.
	 * @returns An SVGGElement containing the grid lines for the rendered map.
	 */
	public render(renderedMap: RenderedMap): SVGGElement {
		const group = this.svg.create('g');

		group.setAttribute('id', 'grid');

		for (const x of renderedMap.xGridLines) {
			const line = this.svg.create('line');

			line.setAttribute('x1', String(x));

			line.setAttribute('y1', String(this.layout.mapMargin));

			line.setAttribute('x2', String(x));

			line.setAttribute('y2', String(renderedMap.height - this.layout.mapMargin));

			line.setAttribute('stroke', 'rgb(100,100,100)');

			line.setAttribute('stroke-width', '3');

			group.append(line);
		}

		for (const y of renderedMap.yGridLines) {
			const line = this.svg.create('line');

			line.setAttribute('x1', String(this.layout.mapMargin));

			line.setAttribute('y1', String(y));

			line.setAttribute('x2', String(renderedMap.width - this.layout.mapMargin));

			line.setAttribute('y2', String(y));

			line.setAttribute('stroke', 'rgb(100,100,100)');

			line.setAttribute('stroke-width', '3');

			group.append(line);
		}

		return group;
	}
}
