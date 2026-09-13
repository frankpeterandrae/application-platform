/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { Position3d, StarSystem } from '@application-platform/starmap-domain';
import { Box3, MathUtils, PerspectiveCamera, Vector3 } from 'three';

import { STARMAP_3D_SCALE } from '../rendering/starmap-3d-scale';
/**
 * Manages the perspective camera of the 3D star map.
 */
@Injectable({
	providedIn: 'root'
})
export class CameraService {
	private readonly camera = new PerspectiveCamera(60, 1, 0.1, 10_000);

	constructor() {
		this.camera.position.set(0, 0, 10);
	}

	/**
	 * Get the camera.
	 */
	public getCamera(): PerspectiveCamera {
		return this.camera;
	}

	/**
	 * Resize the camera's aspect ratio and update its projection matrix.
	 * @param width The new width of the viewport.
	 * @param height The new height of the viewport.
	 */
	public resize(width: number, height: number): void {
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
	}

	/**
	 * Adjusts the camera position and orientation to fit all provided star systems within the view.
	 * @param systems The star systems to fit within the camera's view.
	 * @returns The center position of the fitted systems, or null if no systems are provided.
	 */
	public fitToSystems(systems: readonly StarSystem[]): Position3d | null {
		if (systems.length === 0) {
			return null;
		}

		const box = new Box3();

		for (const system of systems) {
			box.expandByPoint(
				new Vector3(
					system.position.x * STARMAP_3D_SCALE.systemDistance,
					system.position.y * STARMAP_3D_SCALE.systemDistance,
					system.position.z * STARMAP_3D_SCALE.systemDistance
				)
			);
		}

		const center = box.getCenter(new Vector3());
		const size = box.getSize(new Vector3());

		const radius = Math.max(size.length() / 2, 1);

		const verticalFov = MathUtils.degToRad(this.camera.fov);
		const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);

		const limitingFov = Math.min(verticalFov, horizontalFov);

		const distance = (radius / Math.sin(limitingFov / 2)) * 1.2;

		this.camera.position.set(center.x, center.y, center.z + distance);

		this.camera.lookAt(center);
		this.camera.updateProjectionMatrix();

		return {
			x: center.x,
			y: center.y,
			z: center.z
		};
	}
}
