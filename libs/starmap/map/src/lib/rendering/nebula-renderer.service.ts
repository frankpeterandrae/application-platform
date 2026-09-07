/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Injectable, inject } from '@angular/core';
import { Nebula, NebulaType, StarMap } from '@application-platform/starmap-domain';

import { MapLayoutService } from './map-layout.service';
import { RenderedMap, SvgPoint } from './render-models';
import { SvgElementService } from './svg-element.service';

/**
 * Service responsible for rendering nebulae for a rendered map as an SVG group element.
 */
@Injectable({
	providedIn: 'root'
})
export class NebulaRendererService {
	private readonly layout = inject(MapLayoutService);
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
			if (nebula.points.length < 3) {
				continue;
			}

			const points = nebula.points.map((point) => ({
				x: (point.x - renderedMap.bounds.minX + 1) * this.layout.gridSize,
				y: (point.y - renderedMap.bounds.minY + 1) * this.layout.gridSize
			}));

			const path = this.svg.create('path');

			path.setAttribute('d', this.createSmoothClosedPath(points, this.getTension(nebula.style)));

			this.applyStyle(path, nebula);

			const nebulaGroup = this.svg.create('g');

			nebulaGroup.dataset['nebulaName'] = nebula.name;

			nebulaGroup.append(path);

			group.append(nebulaGroup);
		}

		return group;
	}

	private getTension(style: NebulaType): number {
		switch (style) {
			case 'outline':
				return 0.65;

			case 'haze':
				return 1.5;

			default:
				return 1;
		}
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

	private createSmoothClosedPath(points: SvgPoint[], tension: number): string {
		if (points.length < 3) {
			return '';
		}

		const commands = [`M ${points[0].x},${points[0].y}`];

		for (let index = 0; index < points.length; index++) {
			const previous = points[(index - 1 + points.length) % points.length];

			const current = points[index];

			const next = points[(index + 1) % points.length];

			const nextNext = points[(index + 2) % points.length];

			const controlPoint1 = {
				x: current.x + ((next.x - previous.x) * tension) / 6,
				y: current.y + ((next.y - previous.y) * tension) / 6
			};

			const controlPoint2 = {
				x: next.x - ((nextNext.x - current.x) * tension) / 6,
				y: next.y - ((nextNext.y - current.y) * tension) / 6
			};

			commands.push(`C ${controlPoint1.x},${controlPoint1.y} ` + `${controlPoint2.x},${controlPoint2.y} ` + `${next.x},${next.y}`);
		}

		commands.push('Z');

		return commands.join(' ');
	}
}
