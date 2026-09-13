/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { WebGLRenderer } from 'three';

/**
 * Creates Three.js WebGL renderer instances.
 */
@Injectable({
	providedIn: 'root'
})
export class WebglRendererFactory {
	/**
	 * Creates a new WebGL renderer.
	 *
	 * @returns The created renderer.
	 */
	public create(): WebGLRenderer {
		return new WebGLRenderer({
			antialias: true
		});
	}
}
