/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Injectable, inject } from '@angular/core';
import { Nebula, StarMap } from '@application-platform/starmap-domain';

import { NebulaContourService } from './nebula-contour.service';
import { RenderedMap } from './render-models';
import { SvgElementService } from './svg-element.service';

/**
 * Service responsible for rendering nebulae for a rendered map as an SVG group element.
 */
@Injectable({
	providedIn: 'root'
})
export class NebulaRendererService {
	private readonly contourService = inject(NebulaContourService);
	private readonly svg = inject(SvgElementService);

	/**
	 * Renders the nebulae of the given star map as an SVG group element.
	 * @param map The star map containing the nebulae to render.
	 * @param renderedMap The rendered map data for positioning the nebulae.
	 * @returns An SVGGElement containing the rendered nebulae.
	 */
	public render(map: StarMap, renderedMap: RenderedMap): SVGGElement {
		const group = this.svg.create('g');

		group.setAttribute('id', 'nebulae');

		for (const nebula of map.nebulae) {
			const pathData = this.contourService.createPath(nebula, renderedMap);

			if (!pathData) {
				continue;
			}

			const path = this.svg.create('path');

			path.setAttribute('d', pathData);

			this.applyStyle(path, nebula);

			const nebulaGroup = this.svg.create('g');

			nebulaGroup.dataset['nebulaName'] = nebula.name;

			nebulaGroup.append(path);

			group.append(nebulaGroup);
		}

		return group;
	}

	private applyStyle(path: SVGPathElement, nebula: Nebula): void {
		path.setAttribute('stroke-linejoin', 'round');

		path.setAttribute('stroke-linecap', 'round');

		switch (nebula.style) {
			case 'outline':
				path.setAttribute('fill', 'none');
				path.setAttribute('stroke', nebula.color);
				path.setAttribute('stroke-opacity', String(nebula.opacity));
				path.setAttribute('stroke-width', '6');
				break;

			case 'haze':
				path.setAttribute('fill', nebula.color);
				path.setAttribute('fill-opacity', String(nebula.opacity * 0.55));
				path.setAttribute('stroke', nebula.color);
				path.setAttribute('stroke-opacity', String(nebula.opacity * 0.35));
				path.setAttribute('stroke-width', '18');
				break;

			default:
				path.setAttribute('fill', nebula.color);
				path.setAttribute('fill-opacity', String(nebula.opacity));
				path.setAttribute('stroke', 'none');
		}
	}
}
