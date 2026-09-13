/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { Scene } from 'three';

/**
 * Provides the Three.js scene used by the 3D star map renderer.
 */
@Injectable({
	providedIn: 'root'
})
export class StarMapSceneService {
	private readonly scene = new Scene();

	/**
	 * Get the Scene.
	 */
	public getScene(): Scene {
		return this.scene;
	}
}
