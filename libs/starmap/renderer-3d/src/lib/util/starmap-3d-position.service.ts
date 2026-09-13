/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { Position3d } from '@application-platform/starmap-domain';
import { Vector3 } from 'three';

import { STARMAP_3D_SCALE } from '../rendering/starmap-3d-scale';

/**
 * Service for converting 3D positions to Three.js Vector3 objects.
 */
@Injectable({
	providedIn: 'root'
})
export class Starmap3dPositionService {
	/**
	 * Converts a 3D position to a Three.js Vector3 object, applying the appropriate scaling.
	 * @param position The 3D position to convert.
	 * @returns A Vector3 object representing the scaled position.
	 */
	public toVector3(position: Position3d): Vector3 {
		return new Vector3(
			position.x * STARMAP_3D_SCALE.systemDistance,
			-position.y * STARMAP_3D_SCALE.systemDistance,
			position.z * STARMAP_3D_SCALE.systemDistance
		);
	}
}
