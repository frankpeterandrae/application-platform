/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { StarSystem } from '@application-platform/starmap-domain';
import { Vector3 } from 'three';

import { Starmap3dPositionService } from '../util/starmap-3d-position.service';

/**
 * Service to determine the visibility of star system labels based on their distance from the camera.
 */
@Injectable({
	providedIn: 'root'
})
export class SystemLabelVisibilityService {
	private readonly positionService = inject(Starmap3dPositionService);

	/**
	 * Gets each star system together with its distance from the camera position.
	 *
	 * @param systems Star systems to evaluate.
	 * @param cameraPosition Current camera position in 3D space.
	 * @param maxLabels Maximum number of labels to consider for visibility.
	 * @returns System-distance pairs that can be used for label visibility checks.
	 */
	public getVisibleSystemIds(systems: readonly StarSystem[], cameraPosition: Vector3, maxLabels = 30): ReadonlySet<string> {
		const systemsByDistance = systems
			.map((system) => ({
				system,
				distance: cameraPosition.distanceTo(this.positionService.toVector3(system.position))
			}))
			.sort((a, b) => a.distance - b.distance)
			.slice(0, maxLabels);

		return new Set(systemsByDistance.map(({ system }) => system.id));
	}
}
