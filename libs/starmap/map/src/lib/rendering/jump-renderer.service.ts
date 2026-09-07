/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Injectable, inject } from '@angular/core';
import { JumpLinkStatus, StarMap, StarSystem } from '@application-platform/starmap-domain';

import { SvgPoint } from './render-models';
import { SvgElementService } from './svg-element.service';
import { SystemRendererService } from './system-renderer.service';

/**
 * Service responsible for rendering jump links for a rendered map as an SVG group element.
 */
@Injectable({
	providedIn: 'root'
})
export class JumpRendererService {
	private readonly svg = inject(SvgElementService);

	private readonly systemRenderer = inject(SystemRendererService);

	private readonly styles: Record<
		JumpLinkStatus,
		{
			color: string;
			strokeWidth: number;
			dash?: [number, number];
		}
	> = {
		normal: {
			color: '#ffffff',
			strokeWidth: 5
		},
		caution: {
			color: '#ffd43b',
			strokeWidth: 5,
			dash: [12, 8]
		},
		dangerous: {
			color: '#ff7a00',
			strokeWidth: 7
		},
		blocked: {
			color: '#ff3b30',
			strokeWidth: 6,
			dash: [4, 7]
		},
		lost: {
			color: '#0033cc',
			strokeWidth: 6,
			dash: [4, 7]
		}
	};

	/**
	 * Renders the jump links of the given star map as an SVG group element.
	 * @param map The star map containing the jump links to render.
	 * @returns An SVGGElement containing the rendered jump links.
	 */
	public render(map: StarMap): SVGGElement {
		const group = this.svg.create('g');

		group.setAttribute('id', 'jumps');

		for (const link of map.jumpLinks) {
			const startSystem = map.systems.find((system) => system.id === link.startSystemId);

			const endSystem = map.systems.find((system) => system.id === link.endSystemId);

			if (!startSystem || !endSystem || startSystem.id === endSystem.id) {
				continue;
			}

			const start = this.systemRenderer.getRenderedSystem(startSystem, map).position;

			const end = this.systemRenderer.getRenderedSystem(endSystem, map).position;

			const style = this.styles[link.status];

			const line = this.svg.create('line');

			line.setAttribute('x1', String(start.x));

			line.setAttribute('y1', String(start.y));

			line.setAttribute('x2', String(end.x));

			line.setAttribute('y2', String(end.y));

			line.setAttribute('stroke', style.color);

			line.setAttribute('stroke-width', String(style.strokeWidth));

			if (style.dash) {
				line.setAttribute('stroke-dasharray', style.dash.join(','));
			}

			const labelPosition = this.getLabelPosition(start, end);

			const label = this.svg.create('text');

			label.setAttribute('x', String(labelPosition.x));

			label.setAttribute('y', String(labelPosition.y));

			label.setAttribute('font-size', '40');

			label.setAttribute('font-family', 'Arial, Helvetica, sans-serif');

			label.setAttribute('fill', style.color);

			label.textContent = String(this.getDistance(startSystem, endSystem));

			group.append(line, label);
		}

		return group;
	}

	private getDistance(start: StarSystem, end: StarSystem): number {
		const deltaX = start.position.x - end.position.x;

		const deltaY = start.position.y - end.position.y;

		const deltaZ = start.position.z - end.position.z;

		return Math.floor(Math.hypot(deltaX, deltaY, deltaZ) + 0.5);
	}

	private getLabelPosition(start: SvgPoint, end: SvgPoint): SvgPoint {
		const offset = {
			x: -45,
			y: -45
		};

		let xScale: number;
		let yScale = 0;
		let slope = 0;
		let angle = 0;

		if (start.x !== end.x) {
			slope = (start.y - end.y) / (end.x - start.x);

			angle = (Math.atan(-slope) * 180) / Math.PI;

			xScale = Math.sin(Math.atan(slope) * 2);

			yScale = Math.sin(Math.atan(slope) * 2);

			if (Math.abs(angle) >= 45) {
				xScale = -xScale;
			}

			if (slope < 0) {
				xScale = -xScale;
			}
		} else {
			xScale = -0.2;
		}

		if (slope === 0) {
			yScale /= 2;
		} else if (Math.abs(angle) < 10) {
			yScale *= 0.8;
		}

		return {
			x: (start.x + end.x) / 2 + xScale * offset.x,

			y: (start.y + end.y) / 2 + yScale * offset.y
		};
	}
}
