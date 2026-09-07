/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { inject, Injectable } from '@angular/core';
import { StarMap } from '@application-platform/starmap-domain';

import { AxisRendererService } from './axis-renderer.service';
import { GridRendererService } from './grid-renderer.service';
import { JumpRendererService } from './jump-renderer.service';
import { MapLayoutService } from './map-layout.service';
import { NebulaRendererService } from './nebula-renderer.service';
import { RenderedMap } from './render-models';
import { StarRendererService } from './star-renderer.service';
import { SvgElementService } from './svg-element.service';
import { SystemRendererService } from './system-renderer.service';

/**
 * Service responsible for rendering a star map as an SVG element.
 */
@Injectable({
	providedIn: 'root'
})
export class StarMapSvgRendererService {
	private readonly layout = inject(MapLayoutService);

	private readonly svg = inject(SvgElementService);

	private readonly gridRenderer = inject(GridRendererService);

	private readonly axisRenderer = inject(AxisRendererService);

	private readonly nebulaRenderer = inject(NebulaRendererService);

	private readonly jumpRenderer = inject(JumpRendererService);

	private readonly starRenderer = inject(StarRendererService);

	private readonly systemRenderer = inject(SystemRendererService);

	/**
	 * Renders the given star map as an SVG element.
	 * @param map The star map to render.
	 * @returns An SVGSVGElement representing the rendered star map.
	 */
	public render(map: StarMap): SVGSVGElement {
		const renderedMap = this.layout.getRenderedMap(map);

		const root = this.svg.create('svg');

		root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

		root.setAttribute('viewBox', `0 0 ${renderedMap.width} ${renderedMap.height}`);

		root.setAttribute('width', String(renderedMap.width));

		root.setAttribute('height', String(renderedMap.height));

		const background = this.createBackground(renderedMap);

		root.append(
			this.starRenderer.renderDefinitions(map),

			background,

			this.nebulaRenderer.render(map, renderedMap),

			this.gridRenderer.render(renderedMap),

			this.axisRenderer.render(renderedMap),

			this.jumpRenderer.render(map),

			this.systemRenderer.renderSystems(map),

			this.systemRenderer.renderNames(map)
		);

		return root;
	}

	private createBackground(renderedMap: RenderedMap): SVGGElement {
		const group = this.svg.create('g');
		group.setAttribute('id', 'background');

		const background = this.svg.create('rect');

		background.setAttribute('x', '0');
		background.setAttribute('y', '0');
		background.setAttribute('width', String(renderedMap.width));
		background.setAttribute('height', String(renderedMap.height));
		background.setAttribute('fill', 'black');

		group.append(background);

		return group;
	}
}
