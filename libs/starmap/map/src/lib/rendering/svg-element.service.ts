/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';

/**
 * Service for creating SVG elements with the correct namespace.
 */
@Injectable({
	providedIn: 'root'
})
export class SvgElementService {
	private readonly namespace = 'http://www.w3.org/2000/svg';

	/**
	 * Creates an SVG element with the specified tag name.
	 * @param tag The tag name of the SVG element to create.
	 * @returns The created SVG element.
	 */
	public create<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
		return document.createElementNS(this.namespace, tag);
	}
}
